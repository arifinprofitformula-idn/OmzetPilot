import "server-only";

import { generateMissionForUser } from "@/src/lib/mission";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { buildMissionDoneKeyboard, sendTelegramMessage } from "@/src/lib/telegram";
import type { Json, Tables } from "@/src/types/database.types";

type UserRow = Tables<"users">;
type MissionRow = Tables<"missions">;
type MissionItemRow = Tables<"mission_items">;

type FormatMissionMessageInput = {
  user: UserRow;
  mission: MissionRow;
  mission_items: MissionItemRow[];
};

type SendMissionResult = {
  mission: MissionRow;
  mission_items: MissionItemRow[];
  telegram_result: unknown;
};

function escapeHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getMissionTypeLabel(missionType: string) {
  switch (missionType) {
    case "follow_up":
      return "FOLLOW UP";
    case "offer":
      return "OFFER";
    case "content_traffic":
      return "KONTEN / TRAFFIC";
    default:
      return missionType.toUpperCase().replace(/_/g, " ");
  }
}

function getMissionItemByOrder(
  missionItems: MissionItemRow[],
  missionOrder: number
): MissionItemRow {
  const item = missionItems.find(
    (missionItem) => missionItem.mission_order === missionOrder
  );

  if (!item) {
    throw new Error(`Mission item ${missionOrder} not found`);
  }

  return item;
}

export function formatMissionMessage(input: FormatMissionMessageInput): string {
  if (input.mission_items.length !== 3) {
    throw new Error("Mission delivery requires exactly 3 mission items");
  }

  const mission1 = getMissionItemByOrder(input.mission_items, 1);
  const mission2 = getMissionItemByOrder(input.mission_items, 2);
  const mission3 = getMissionItemByOrder(input.mission_items, 3);
  const userName = escapeHtml(input.user.full_name);

  return [
    `Selamat pagi, Kak ${userName}. OmzetPilot siap bantu kawal jualan hari ini.`,
    "",
    `<b>🎯 MISI 1 — ${getMissionTypeLabel(mission1.mission_type)}</b>`,
    `Target: ${escapeHtml(mission1.target_description)}`,
    `Aksi: ${escapeHtml(mission1.action_instruction)}`,
    `Script: ${escapeHtml(mission1.script_text || "-")}`,
    `Target minimal: ${escapeHtml(mission1.target_minimum || "-")}`,
    "",
    `<b>🎯 MISI 2 — ${getMissionTypeLabel(mission2.mission_type)}</b>`,
    `Target: ${escapeHtml(mission2.target_description)}`,
    `Aksi: ${escapeHtml(mission2.action_instruction)}`,
    `Script: ${escapeHtml(mission2.script_text || "-")}`,
    `Target minimal: ${escapeHtml(mission2.target_minimum || "-")}`,
    "",
    `<b>🎯 MISI 3 — ${getMissionTypeLabel(mission3.mission_type)}</b>`,
    `Target: ${escapeHtml(mission3.target_description)}`,
    `Aksi: ${escapeHtml(mission3.action_instruction)}`,
    `Draft/Script: ${escapeHtml(mission3.script_text || "-")}`,
    `Target minimal: ${escapeHtml(mission3.target_minimum || "-")}`,
    "",
    "Target hari ini: cukup jalankan minimal 1 dari 3 misi dulu. Yang penting jualan tetap bergerak.",
  ].join("\n");
}

async function getUserById(userId: string): Promise<UserRow> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  if (!data) {
    throw new Error("User not found");
  }

  return data;
}

async function updateMissionAsSent(missionId: string): Promise<MissionRow> {
  const sentAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("missions")
    .update({
      mission_status: "sent",
      sent_at: sentAt,
    })
    .eq("id", missionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update mission as sent: ${error.message}`);
  }

  return data;
}

async function hasMissionSentActivity(
  userId: string,
  missionId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .eq("activity_type", "mission_sent")
    .eq("channel", "telegram")
    .limit(1);

  if (error) {
    throw new Error(`Failed to check mission_sent activity log: ${error.message}`);
  }

  return data.length > 0;
}

async function insertMissionSentActivity(userId: string, missionId: string) {
  const metadata: Json = {
    mission_id: missionId,
    source: "manual_test_send",
  };

  const { error } = await supabaseAdmin.from("user_activity_logs").insert({
    user_id: userId,
    mission_id: missionId,
    activity_type: "mission_sent",
    channel: "telegram",
    metadata,
  });

  if (error) {
    throw new Error(`Failed to insert mission_sent activity log: ${error.message}`);
  }
}

export async function sendMissionToUser(
  userId: string
): Promise<SendMissionResult> {
  const user = await getUserById(userId);

  if (!user.telegram_chat_id) {
    throw new Error("User does not have telegram_chat_id");
  }

  const missionResult = await generateMissionForUser(userId);
  const messageText = formatMissionMessage({
    user,
    mission: missionResult.mission,
    mission_items: missionResult.mission_items,
  });
  const replyMarkup = buildMissionDoneKeyboard(missionResult.mission_items);
  const telegramResult = await sendTelegramMessage(
    user.telegram_chat_id,
    messageText,
    replyMarkup
  );

  let mission = missionResult.mission;

  if (mission.mission_status === "drafted") {
    mission = await updateMissionAsSent(mission.id);
  }

  if (
    mission.mission_status === "sent" ||
    mission.mission_status === "reported" ||
    missionResult.mission.mission_status === "drafted"
  ) {
    const alreadyLogged = await hasMissionSentActivity(userId, mission.id);

    if (!alreadyLogged) {
      await insertMissionSentActivity(userId, mission.id);
    }
  }

  return {
    mission,
    mission_items: missionResult.mission_items,
    telegram_result: telegramResult,
  };
}
