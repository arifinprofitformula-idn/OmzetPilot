import "server-only";

import { getTodayInJakarta } from "@/src/lib/time";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type MissionRow = Tables<"missions">;
type UserRow = Tables<"users">;
type MissionItemRow = Tables<"mission_items">;
type MissionReportRow = Tables<"mission_reports">;
type MissionEvaluationRow = Tables<"mission_evaluations">;

export type MissionStatusFilter =
  | "all"
  | "drafted"
  | "sent"
  | "reported"
  | "missed"
  | "cancelled";

export type MissionReportFilter = "all" | "reported" | "not_reported";

export type MissionMonitorFilters = {
  date: string;
  status: MissionStatusFilter;
  report: MissionReportFilter;
};

export type MissionMonitorRow = {
  mission: MissionRow;
  user: UserRow | null;
  missionItems: MissionItemRow[];
  report: MissionReportRow | null;
  evaluation: MissionEvaluationRow | null;
  telegramStatus: "connected" | "not_connected";
  doneItemsCount: number;
  rga: number;
  reportStatus: "reported" | "not_reported";
};

export type MissionMonitorData = {
  filters: MissionMonitorFilters;
  rows: MissionMonitorRow[];
  summary: {
    totalMissions: number;
    sentMissions: number;
    reportedMissions: number;
    totalRga: number;
    closingReports: number;
    needsReport: number;
  };
};

const MISSION_STATUS_FILTERS = new Set<MissionStatusFilter>([
  "all",
  "drafted",
  "sent",
  "reported",
  "missed",
  "cancelled",
]);

const REPORT_FILTERS = new Set<MissionReportFilter>([
  "all",
  "reported",
  "not_reported",
]);

function isValidDateString(value: string | undefined) {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeFilters(input: {
  date?: string;
  status?: string;
  report?: string;
}): MissionMonitorFilters {
  const today = getTodayInJakarta();
  const date: string = isValidDateString(input.date) ? input.date : today;
  const status: MissionStatusFilter = MISSION_STATUS_FILTERS.has(
    input.status as MissionStatusFilter
  )
    ? (input.status as MissionStatusFilter)
    : "all";
  const report: MissionReportFilter = REPORT_FILTERS.has(
    input.report as MissionReportFilter
  )
    ? (input.report as MissionReportFilter)
    : "all";

  return {
    date,
    status,
    report,
  };
}

export async function getAdminMissionsData(input: {
  date?: string;
  status?: string;
  report?: string;
}): Promise<MissionMonitorData> {
  const filters = normalizeFilters(input);

  let missionQuery = supabaseAdmin
    .from("missions")
    .select("*")
    .eq("mission_date", filters.date)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") {
    missionQuery = missionQuery.eq("mission_status", filters.status);
  }

  const { data: missions, error: missionsError } = await missionQuery;

  if (missionsError) {
    throw new Error(`Failed to load missions: ${missionsError.message}`);
  }

  const missionRows = missions ?? [];
  const userIds = Array.from(new Set(missionRows.map((mission) => mission.user_id)));
  const missionIds = missionRows.map((mission) => mission.id);

  let users: UserRow[] = [];
  let missionItems: MissionItemRow[] = [];
  let missionReports: MissionReportRow[] = [];
  let missionEvaluations: MissionEvaluationRow[] = [];

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
    const [missionItemsResult, missionReportsResult, missionEvaluationsResult] =
      await Promise.all([
        supabaseAdmin
          .from("mission_items")
          .select("*")
          .in("mission_id", missionIds)
          .order("mission_order", { ascending: true }),
        supabaseAdmin
          .from("mission_reports")
          .select("*")
          .in("mission_id", missionIds),
        supabaseAdmin
          .from("mission_evaluations")
          .select("*")
          .in("mission_id", missionIds),
      ]);

    if (missionItemsResult.error) {
      throw new Error(
        `Failed to load mission items: ${missionItemsResult.error.message}`
      );
    }

    if (missionReportsResult.error) {
      throw new Error(
        `Failed to load mission reports: ${missionReportsResult.error.message}`
      );
    }

    if (missionEvaluationsResult.error) {
      throw new Error(
        `Failed to load mission evaluations: ${missionEvaluationsResult.error.message}`
      );
    }

    missionItems = missionItemsResult.data ?? [];
    missionReports = missionReportsResult.data ?? [];
    missionEvaluations = missionEvaluationsResult.data ?? [];
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  const reportMap = new Map(missionReports.map((report) => [report.mission_id, report]));
  const evaluationMap = new Map(
    missionEvaluations.map((evaluation) => [evaluation.mission_id, evaluation])
  );
  const itemMap = new Map<string, MissionItemRow[]>();

  for (const item of missionItems) {
    const itemsForMission = itemMap.get(item.mission_id) ?? [];
    itemsForMission.push(item);
    itemMap.set(item.mission_id, itemsForMission);
  }

  let rows: MissionMonitorRow[] = missionRows.map((mission) => {
    const user = userMap.get(mission.user_id) ?? null;
    const items = itemMap.get(mission.id) ?? [];
    const doneItemsCount = items.filter((item) => item.status === "done").length;
    const report = reportMap.get(mission.id) ?? null;
    const evaluation = evaluationMap.get(mission.id) ?? null;

    return {
      mission,
      user,
      missionItems: items,
      report,
      evaluation,
      telegramStatus: user?.telegram_chat_id ? "connected" : "not_connected",
      doneItemsCount,
      rga: report?.rga_count ?? doneItemsCount,
      reportStatus: report ? "reported" : "not_reported",
    };
  });

  if (filters.report !== "all") {
    rows = rows.filter((row) => row.reportStatus === filters.report);
  }

  return {
    filters,
    rows,
    summary: {
      totalMissions: rows.length,
      sentMissions: rows.filter((row) => row.mission.mission_status === "sent").length,
      reportedMissions: rows.filter((row) => row.reportStatus === "reported").length,
      totalRga: rows.reduce((sum, row) => sum + row.rga, 0),
      closingReports: rows.filter((row) => row.report?.closing_status).length,
      needsReport: rows.filter((row) => row.reportStatus === "not_reported").length,
    },
  };
}
