import "server-only";

import { getTodayInJakarta } from "@/src/lib/time";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type AiLogRow = Tables<"ai_logs">;
type UserRow = Tables<"users">;
type MissionRow = Tables<"missions">;

export type AiLogStatusFilter = "all" | "success" | "failed";
export type AiLogProviderFilter =
  | "all"
  | "openai"
  | "gemini"
  | "anthropic"
  | "other";

export type AdminAiLogsFilters = {
  date: string;
  status: AiLogStatusFilter;
  provider: AiLogProviderFilter;
  userId: string;
};

export type AdminAiLogRow = {
  aiLog: AiLogRow;
  user: UserRow | null;
  mission: MissionRow | null;
};

export type AdminAiLogsData = {
  filters: AdminAiLogsFilters;
  rows: AdminAiLogRow[];
  summary: {
    totalAiCalls: number;
    successCalls: number;
    failedCalls: number;
    failureRate: number;
    estimatedCostToday: number;
    averageEstimatedCostPerCall: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
};

const STATUS_FILTERS = new Set<AiLogStatusFilter>(["all", "success", "failed"]);
const PROVIDER_FILTERS = new Set<AiLogProviderFilter>([
  "all",
  "openai",
  "gemini",
  "anthropic",
  "other",
]);
const PRIMARY_PROVIDERS = new Set(["openai", "gemini", "anthropic"]);

function isValidDateString(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getWibRange(date: string) {
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function normalizeFilters(input: {
  date?: string;
  status?: string;
  provider?: string;
  user_id?: string;
}): AdminAiLogsFilters {
  const today = getTodayInJakarta();
  const date = isValidDateString(input.date) ? input.date : today;
  const status: AiLogStatusFilter = STATUS_FILTERS.has(
    input.status as AiLogStatusFilter
  )
    ? (input.status as AiLogStatusFilter)
    : "all";
  const provider: AiLogProviderFilter = PROVIDER_FILTERS.has(
    input.provider as AiLogProviderFilter
  )
    ? (input.provider as AiLogProviderFilter)
    : "all";

  return {
    date,
    status,
    provider,
    userId: input.user_id?.trim() ?? "",
  };
}

export async function getAdminAiLogsData(input: {
  date?: string;
  status?: string;
  provider?: string;
  user_id?: string;
}): Promise<AdminAiLogsData> {
  const filters = normalizeFilters(input);
  const { startIso, endIso } = getWibRange(filters.date);

  let aiLogQuery = supabaseAdmin
    .from("ai_logs")
    .select("*")
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") {
    aiLogQuery = aiLogQuery.eq("status", filters.status);
  }

  if (filters.userId) {
    aiLogQuery = aiLogQuery.eq("user_id", filters.userId);
  }

  if (
    filters.provider !== "all" &&
    filters.provider !== "other"
  ) {
    aiLogQuery = aiLogQuery.eq("model_provider", filters.provider);
  }

  const { data: aiLogs, error: aiLogsError } = await aiLogQuery;

  if (aiLogsError) {
    throw new Error(`Failed to load ai logs: ${aiLogsError.message}`);
  }

  let filteredAiLogs = aiLogs ?? [];

  if (filters.provider === "other") {
    filteredAiLogs = filteredAiLogs.filter(
      (log) => !PRIMARY_PROVIDERS.has(log.model_provider)
    );
  }

  const userIds = Array.from(new Set(filteredAiLogs.map((log) => log.user_id)));
  const missionIds = Array.from(
    new Set(
      filteredAiLogs
        .map((log) => log.mission_id)
        .filter((missionId): missionId is string => Boolean(missionId))
    )
  );

  let users: UserRow[] = [];
  let missions: MissionRow[] = [];

  if (userIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("id", userIds);

    if (error) {
      throw new Error(`Failed to load users: ${error.message}`);
    }

    users = data ?? [];
  }

  if (missionIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("missions")
      .select("*")
      .in("id", missionIds);

    if (error) {
      throw new Error(`Failed to load missions: ${error.message}`);
    }

    missions = data ?? [];
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  const missionMap = new Map(missions.map((mission) => [mission.id, mission]));
  const rows = filteredAiLogs.map((aiLog) => ({
    aiLog,
    user: userMap.get(aiLog.user_id) ?? null,
    mission: aiLog.mission_id ? missionMap.get(aiLog.mission_id) ?? null : null,
  }));

  const totalAiCalls = rows.length;
  const successCalls = rows.filter((row) => row.aiLog.status === "success").length;
  const failedCalls = rows.filter((row) => row.aiLog.status === "failed").length;
  const estimatedCostToday = rows.reduce(
    (sum, row) => sum + (row.aiLog.estimated_cost ?? 0),
    0
  );
  const totalInputTokens = rows.reduce(
    (sum, row) => sum + (row.aiLog.token_input_estimate ?? 0),
    0
  );
  const totalOutputTokens = rows.reduce(
    (sum, row) => sum + (row.aiLog.token_output_estimate ?? 0),
    0
  );

  return {
    filters,
    rows,
    summary: {
      totalAiCalls,
      successCalls,
      failedCalls,
      failureRate: totalAiCalls > 0 ? (failedCalls / totalAiCalls) * 100 : 0,
      estimatedCostToday,
      averageEstimatedCostPerCall:
        totalAiCalls > 0 ? estimatedCostToday / totalAiCalls : 0,
      totalInputTokens,
      totalOutputTokens,
    },
  };
}
