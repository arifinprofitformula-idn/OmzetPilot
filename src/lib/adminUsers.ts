import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type UserRow = Tables<"users">;
type UserMissionSummaryRow = Tables<"v_user_mission_summary">;

export type AdminUserRecord = {
  id: string;
  name: string;
  whatsapp: string;
  telegramStatus: "connected" | "not_connected";
  userStatus: string;
  fitScore: string | null;
  cohort: string;
  totalRga: number;
  totalReports: number;
  totalRevenue: number;
};

export type AdminUsersPageData = {
  users: AdminUserRecord[];
  summary: {
    totalUsers: number;
    telegramConnected: number;
    activeUsers: number;
    needsAttention: number;
  };
};

function mapSummaryByUserId(summaryRows: UserMissionSummaryRow[] | null) {
  return new Map(
    (summaryRows ?? [])
      .filter((row): row is UserMissionSummaryRow & { user_id: string } =>
        Boolean(row.user_id)
      )
      .map((row) => [row.user_id, row])
  );
}

function normalizeUsers(
  users: UserRow[],
  summaryRows: UserMissionSummaryRow[] | null
): AdminUserRecord[] {
  const summaryMap = mapSummaryByUserId(summaryRows);

  return users.map((user) => {
    const userSummary = summaryMap.get(user.id);

    return {
      id: user.id,
      name: user.full_name,
      whatsapp: user.whatsapp_number,
      telegramStatus: user.telegram_chat_id ? "connected" : "not_connected",
      userStatus: user.status,
      fitScore: user.fit_score,
      cohort: user.cohort_name,
      totalRga: userSummary?.total_rga ?? 0,
      totalReports: userSummary?.total_reports ?? 0,
      totalRevenue: userSummary?.total_revenue ?? 0,
    };
  });
}

export async function getAdminUsersPageData(): Promise<AdminUsersPageData> {
  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (usersError) {
    throw new Error(`Failed to load users: ${usersError.message}`);
  }

  const { data: summaryRows, error: summaryError } = await supabaseAdmin
    .from("v_user_mission_summary")
    .select("*");

  const normalizedUsers = normalizeUsers(users ?? [], summaryError ? null : summaryRows);
  const totalUsers = normalizedUsers.length;
  const telegramConnected = normalizedUsers.filter(
    (user) => user.telegramStatus === "connected"
  ).length;
  const activeUsers = normalizedUsers.filter(
    (user) => user.userStatus === "active"
  ).length;
  const needsAttention = normalizedUsers.filter((user) =>
    ["at_risk", "inactive"].includes(user.userStatus)
  ).length;

  return {
    users: normalizedUsers,
    summary: {
      totalUsers,
      telegramConnected,
      activeUsers,
      needsAttention,
    },
  };
}
