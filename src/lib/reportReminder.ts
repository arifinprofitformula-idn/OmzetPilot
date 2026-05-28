import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";
import { buildReportCodeKeyboard, sendTelegramMessage } from "@/src/lib/telegram";
import type { Json, Tables } from "@/src/types/database.types";

type MissionRow = Tables<"missions">;
type UserRow = Tables<"users">;

export type EveningReportEligibleMission = {
  mission: MissionRow;
  user: UserRow;
};

async function hasReportRequestSentActivity(
  userId: string,
  missionId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .eq("activity_type", "evening_report_request_sent")
    .eq("channel", "telegram")
    .limit(1);

  if (error) {
    throw new Error(
      `Failed to check evening report activity log: ${error.message}`
    );
  }

  return (data?.length ?? 0) > 0;
}

async function insertReportRequestSentActivity(userId: string, missionId: string) {
  const metadata: Json = {
    mission_id: missionId,
    source: "admin_action",
  };

  const { error } = await supabaseAdmin.from("user_activity_logs").insert({
    user_id: userId,
    mission_id: missionId,
    activity_type: "evening_report_request_sent",
    channel: "telegram",
    metadata,
  });

  if (error) {
    throw new Error(
      `Failed to insert evening report activity log: ${error.message}`
    );
  }
}

export async function getMissionsNeedingEveningReport(): Promise<
  EveningReportEligibleMission[]
> {
  const today = getTodayInJakarta();
  const { data: missions, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("mission_date", today)
    .in("mission_status", ["sent", "drafted"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load missions needing report: ${error.message}`);
  }

  const missionRows = missions ?? [];

  if (missionRows.length === 0) {
    return [];
  }

  const missionIds = missionRows.map((mission) => mission.id);
  const userIds = Array.from(new Set(missionRows.map((mission) => mission.user_id)));

  const [{ data: reports, error: reportsError }, { data: users, error: usersError }] =
    await Promise.all([
      supabaseAdmin
        .from("mission_reports")
        .select("mission_id")
        .in("mission_id", missionIds),
      supabaseAdmin.from("users").select("*").in("id", userIds),
    ]);

  if (reportsError) {
    throw new Error(`Failed to load mission reports: ${reportsError.message}`);
  }

  if (usersError) {
    throw new Error(`Failed to load users for report reminder: ${usersError.message}`);
  }

  const reportedMissionIds = new Set((reports ?? []).map((report) => report.mission_id));
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return missionRows
    .map((mission) => {
      const user = userMap.get(mission.user_id);

      if (!user || !user.telegram_chat_id) {
        return null;
      }

      if (reportedMissionIds.has(mission.id)) {
        return null;
      }

      return { mission, user };
    })
    .filter((value): value is EveningReportEligibleMission => Boolean(value));
}

export async function sendEveningReportRequestForMission(
  eligibleMission: EveningReportEligibleMission
) {
  const alreadyLogged = await hasReportRequestSentActivity(
    eligibleMission.user.id,
    eligibleMission.mission.id
  );

  if (alreadyLogged) {
    return {
      skipped: true,
      reason: "already_sent",
    };
  }

  const message = [
    `Halo ${eligibleMission.user.full_name}, waktunya kirim report OmzetPilot hari ini.`,
    "",
    "Pilih kode report yang paling sesuai:",
    "1 = Closing / Money In",
    "2 = Response, Not Closing Yet",
    "3 = Done, No Response",
    "4 = Not Executed",
  ].join("\n");

  const telegramResult = await sendTelegramMessage(
    eligibleMission.user.telegram_chat_id!,
    message,
    buildReportCodeKeyboard(eligibleMission.mission.id)
  );

  await insertReportRequestSentActivity(
    eligibleMission.user.id,
    eligibleMission.mission.id
  );

  return {
    skipped: false,
    telegramResult,
  };
}
