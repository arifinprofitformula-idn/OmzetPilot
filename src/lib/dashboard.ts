import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  telegramConnectedUsers: number;
  missionsSentToday: number;
  rgaToday: number;
  reportsToday: number;
  closingReportsToday: number;
  atRiskUsers: number;
  todayWib: string;
};

type ReportSnapshot = {
  user_id: string;
  rga_count: number;
  closing_status: boolean;
};

function getTodayWibRange(todayWib: string) {
  const start = new Date(`${todayWib}T00:00:00+07:00`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function requireCount(
  label: string,
  result: { count: number | null; error: { message: string } | null }
) {
  if (result.error) {
    throw new Error(`Failed to load ${label}: ${result.error.message}`);
  }

  return result.count ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayWib = getTodayInJakarta();
  const { startIso, endIso } = getTodayWibRange(todayWib);

  const [
    totalUsersResult,
    activeUsersResult,
    connectedUsersResult,
    activeConnectedUsersResult,
    missionsSentTodayResult,
    reportsTodayResult,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabaseAdmin
      .from("users")
      .select("id, telegram_chat_id")
      .not("telegram_chat_id", "is", null),
    supabaseAdmin
      .from("users")
      .select("id, telegram_chat_id")
      .eq("status", "active")
      .not("telegram_chat_id", "is", null),
    supabaseAdmin
      .from("missions")
      .select("id", { count: "exact", head: true })
      .eq("mission_date", todayWib)
      .not("sent_at", "is", null),
    supabaseAdmin
      .from("mission_reports")
      .select("user_id, rga_count, closing_status, reported_at")
      .gte("reported_at", startIso)
      .lt("reported_at", endIso),
  ]);

  const totalUsers = requireCount("total users", totalUsersResult);
  const activeUsers = requireCount("active users", activeUsersResult);
  const missionsSentToday = requireCount(
    "missions sent today",
    missionsSentTodayResult
  );

  if (connectedUsersResult.error) {
    throw new Error(
      `Failed to load telegram connected users: ${connectedUsersResult.error.message}`
    );
  }

  if (activeConnectedUsersResult.error) {
    throw new Error(
      `Failed to load active telegram users: ${activeConnectedUsersResult.error.message}`
    );
  }

  if (reportsTodayResult.error) {
    throw new Error(
      `Failed to load reports today: ${reportsTodayResult.error.message}`
    );
  }

  const connectedUsers =
    connectedUsersResult.data?.filter((user) => Boolean(user.telegram_chat_id)) ??
    [];
  const activeConnectedUsers =
    activeConnectedUsersResult.data?.filter((user) =>
      Boolean(user.telegram_chat_id)
    ) ?? [];
  const reportsToday = (reportsTodayResult.data ?? []) as ReportSnapshot[];

  const reportedUserIds = new Set(reportsToday.map((report) => report.user_id));
  const telegramConnectedUsers = connectedUsers.length;
  const rgaToday = reportsToday.reduce(
    (sum, report) => sum + (report.rga_count ?? 0),
    0
  );
  const reportsCountToday = reportsToday.length;
  const closingReportsToday = reportsToday.filter(
    (report) => report.closing_status
  ).length;
  const atRiskUsers = activeConnectedUsers.filter(
    (user) => !reportedUserIds.has(user.id)
  ).length;

  return {
    totalUsers,
    activeUsers,
    telegramConnectedUsers,
    missionsSentToday,
    rgaToday,
    reportsToday: reportsCountToday,
    closingReportsToday,
    atRiskUsers,
    todayWib,
  };
}
