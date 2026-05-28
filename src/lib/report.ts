import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";
import type { Json, Tables } from "@/src/types/database.types";

type UserRow = Tables<"users">;
type MissionRow = Tables<"missions">;
type MissionItemRow = Tables<"mission_items">;
type MissionReportRow = Tables<"mission_reports">;

type MarkMissionItemDoneResult =
  | { status: "user_not_found" }
  | { status: "not_found" }
  | { status: "duplicate"; missionItem: MissionItemRow }
  | { status: "done"; missionItem: MissionItemRow };

type MissionReportCode = "1" | "2" | "3" | "4";

type SubmitMissionReportResult =
  | { status: "user_not_found" }
  | { status: "mission_not_found" }
  | { status: "duplicate"; report: MissionReportRow }
  | { status: "reported"; report: MissionReportRow };

type TodayMissionForTelegramChatResult =
  | { status: "user_not_found" }
  | { status: "no_mission" }
  | { status: "already_reported"; mission: MissionRow }
  | { status: "ready"; mission: MissionRow };

async function getUserByTelegramChatId(
  telegramChatId: string
): Promise<UserRow | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_chat_id", telegramChatId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find user by telegram_chat_id: ${error.message}`);
  }

  return data;
}

async function getMissionItemForUser(
  missionItemId: string,
  userId: string
): Promise<MissionItemRow | null> {
  const { data, error } = await supabaseAdmin
    .from("mission_items")
    .select("*")
    .eq("id", missionItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find mission item: ${error.message}`);
  }

  return data;
}

async function getMissionForUser(
  missionId: string,
  userId: string
): Promise<MissionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find mission: ${error.message}`);
  }

  return data;
}

async function getMissionReportByMissionId(
  missionId: string
): Promise<MissionReportRow | null> {
  const { data, error } = await supabaseAdmin
    .from("mission_reports")
    .select("*")
    .eq("mission_id", missionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find mission report: ${error.message}`);
  }

  return data;
}

async function countDoneMissionItems(missionId: string, userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("mission_items")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .eq("user_id", userId)
    .eq("status", "done");

  if (error) {
    throw new Error(`Failed to count done mission items: ${error.message}`);
  }

  return count ?? 0;
}

async function insertMissionItemDoneActivity(
  userId: string,
  missionId: string,
  missionItemId: string
) {
  const dedupeKey = `mission_item_done:${missionItemId}`;
  const { data, error } = await supabaseAdmin
    .from("user_activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .eq("activity_type", "mission_item_done")
    .eq("channel", "telegram")
    .eq("metadata->>dedupe_key", dedupeKey)
    .limit(1);

  if (error) {
    throw new Error(
      `Failed to check mission_item_done activity log: ${error.message}`
    );
  }

  if ((data?.length ?? 0) > 0) {
    return;
  }

  const metadata: Json = {
    mission_item_id: missionItemId,
    dedupe_key: dedupeKey,
  };

  const { error: insertError } = await supabaseAdmin
    .from("user_activity_logs")
    .insert({
      user_id: userId,
      mission_id: missionId,
      activity_type: "mission_item_done",
      channel: "telegram",
      metadata,
    });

  if (insertError) {
    throw new Error(
      `Failed to insert mission_item_done activity log: ${insertError.message}`
    );
  }
}

async function insertReportReceivedActivity(
  userId: string,
  missionId: string,
  reportCode: MissionReportCode,
  rgaCount: number
) {
  const dedupeKey = `report_received:${missionId}`;
  const { data, error } = await supabaseAdmin
    .from("user_activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .eq("activity_type", "report_received")
    .eq("channel", "telegram")
    .eq("metadata->>dedupe_key", dedupeKey)
    .limit(1);

  if (error) {
    throw new Error(
      `Failed to check report_received activity log: ${error.message}`
    );
  }

  if ((data?.length ?? 0) > 0) {
    return;
  }

  const metadata: Json = {
    report_code: reportCode,
    rga_count: rgaCount,
    dedupe_key: dedupeKey,
  };

  const { error: insertError } = await supabaseAdmin
    .from("user_activity_logs")
    .insert({
      user_id: userId,
      mission_id: missionId,
      activity_type: "report_received",
      channel: "telegram",
      metadata,
    });

  if (insertError) {
    throw new Error(
      `Failed to insert report_received activity log: ${insertError.message}`
    );
  }
}

export async function markMissionItemDone(
  missionItemId: string,
  telegramChatId: string
): Promise<MarkMissionItemDoneResult> {
  const user = await getUserByTelegramChatId(telegramChatId);

  if (!user) {
    return { status: "user_not_found" };
  }

  const missionItem = await getMissionItemForUser(missionItemId, user.id);

  if (!missionItem) {
    return { status: "not_found" };
  }

  if (missionItem.status === "done") {
    return { status: "duplicate", missionItem };
  }

  const completedAt = new Date().toISOString();
  const { data: updatedMissionItem, error: updateError } = await supabaseAdmin
    .from("mission_items")
    .update({
      status: "done",
      completed_at: completedAt,
    })
    .eq("id", missionItemId)
    .eq("user_id", user.id)
    .neq("status", "done")
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to mark mission item done: ${updateError.message}`);
  }

  if (!updatedMissionItem) {
    const duplicateMissionItem = await getMissionItemForUser(missionItemId, user.id);

    if (!duplicateMissionItem) {
      return { status: "not_found" };
    }

    if (duplicateMissionItem.status === "done") {
      return { status: "duplicate", missionItem: duplicateMissionItem };
    }

    throw new Error("Mission item update did not return a row");
  }

  await insertMissionItemDoneActivity(
    user.id,
    updatedMissionItem.mission_id,
    updatedMissionItem.id
  );

  return {
    status: "done",
    missionItem: updatedMissionItem,
  };
}

export async function submitMissionReport(
  missionId: string,
  telegramChatId: string,
  reportCode: MissionReportCode
): Promise<SubmitMissionReportResult> {
  const user = await getUserByTelegramChatId(telegramChatId);

  if (!user) {
    return { status: "user_not_found" };
  }

  const mission = await getMissionForUser(missionId, user.id);

  if (!mission) {
    return { status: "mission_not_found" };
  }

  const existingReport = await getMissionReportByMissionId(missionId);

  if (existingReport) {
    return { status: "duplicate", report: existingReport };
  }

  const rgaCount = await countDoneMissionItems(missionId, user.id);
  const closingStatus = reportCode === "1";

  let report: MissionReportRow;

  try {
    const { data, error } = await supabaseAdmin
      .from("mission_reports")
      .insert({
        mission_id: missionId,
        user_id: user.id,
        report_code: reportCode,
        rga_count: rgaCount,
        closing_status: closingStatus,
        raw_user_reply: reportCode,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    report = data;
  } catch (error) {
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505";

    if (isDuplicate) {
      const duplicateReport = await getMissionReportByMissionId(missionId);

      if (duplicateReport) {
        return { status: "duplicate", report: duplicateReport };
      }
    }

    throw new Error(
      `Failed to insert mission report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  const { error: updateMissionError } = await supabaseAdmin
    .from("missions")
    .update({
      mission_status: "reported",
    })
    .eq("id", missionId)
    .eq("user_id", user.id);

  if (updateMissionError) {
    throw new Error(`Failed to update mission status: ${updateMissionError.message}`);
  }

  await insertReportReceivedActivity(user.id, missionId, reportCode, rgaCount);

  return { status: "reported", report };
}

export async function getTodayMissionForTelegramChat(
  telegramChatId: string
): Promise<TodayMissionForTelegramChatResult> {
  const user = await getUserByTelegramChatId(telegramChatId);

  if (!user) {
    return { status: "user_not_found" };
  }

  const today = getTodayInJakarta();
  const { data: mission, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("user_id", user.id)
    .eq("mission_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find today's mission: ${error.message}`);
  }

  if (!mission) {
    return { status: "no_mission" };
  }

  if (mission.mission_status === "reported") {
    return { status: "already_reported", mission };
  }

  const existingReport = await getMissionReportByMissionId(mission.id);

  if (existingReport) {
    return { status: "already_reported", mission };
  }

  return { status: "ready", mission };
}
