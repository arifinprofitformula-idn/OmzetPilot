import "server-only";

import { getTodayInJakarta } from "@/src/lib/time";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type MissionReportRow = Tables<"mission_reports">;
type MissionRow = Tables<"missions">;
type UserRow = Tables<"users">;
type MissionEvaluationRow = Tables<"mission_evaluations">;

export type ReportCodeFilter = "all" | "1" | "2" | "3" | "4";
export type ClosingFilter = "all" | "yes" | "no";

export type AdminReportsFilters = {
  date: string;
  reportCode: ReportCodeFilter;
  closing: ClosingFilter;
};

export type AdminReportRow = {
  report: MissionReportRow;
  mission: MissionRow | null;
  user: UserRow | null;
  evaluation: MissionEvaluationRow | null;
};

export type AdminReportsData = {
  filters: AdminReportsFilters;
  rows: AdminReportRow[];
  summary: {
    totalReports: number;
    totalRga: number;
    averageRgaPerReport: number;
    closingReports: number;
    totalRevenue: number;
    reportCode1Count: number;
    reportCode2Count: number;
    reportCode3Count: number;
    reportCode4Count: number;
  };
};

const REPORT_CODE_FILTERS = new Set<ReportCodeFilter>(["all", "1", "2", "3", "4"]);
const CLOSING_FILTERS = new Set<ClosingFilter>(["all", "yes", "no"]);

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
  report_code?: string;
  closing?: string;
}): AdminReportsFilters {
  const today = getTodayInJakarta();
  const date = isValidDateString(input.date) ? input.date : today;
  const reportCode: ReportCodeFilter = REPORT_CODE_FILTERS.has(
    input.report_code as ReportCodeFilter
  )
    ? (input.report_code as ReportCodeFilter)
    : "all";
  const closing: ClosingFilter = CLOSING_FILTERS.has(
    input.closing as ClosingFilter
  )
    ? (input.closing as ClosingFilter)
    : "all";

  return {
    date,
    reportCode,
    closing,
  };
}

export async function getAdminReportsData(input: {
  date?: string;
  report_code?: string;
  closing?: string;
}): Promise<AdminReportsData> {
  const filters = normalizeFilters(input);
  const { startIso, endIso } = getWibRange(filters.date);

  let reportQuery = supabaseAdmin
    .from("mission_reports")
    .select("*")
    .gte("reported_at", startIso)
    .lt("reported_at", endIso)
    .order("reported_at", { ascending: false });

  if (filters.reportCode !== "all") {
    reportQuery = reportQuery.eq("report_code", filters.reportCode);
  }

  if (filters.closing === "yes") {
    reportQuery = reportQuery.eq("closing_status", true);
  }

  if (filters.closing === "no") {
    reportQuery = reportQuery.eq("closing_status", false);
  }

  const { data: reports, error: reportsError } = await reportQuery;

  if (reportsError) {
    throw new Error(`Failed to load mission reports: ${reportsError.message}`);
  }

  const reportRows = reports ?? [];
  const missionIds = Array.from(new Set(reportRows.map((report) => report.mission_id)));
  const userIds = Array.from(new Set(reportRows.map((report) => report.user_id)));

  let missions: MissionRow[] = [];
  let users: UserRow[] = [];
  let evaluations: MissionEvaluationRow[] = [];

  if (missionIds.length > 0) {
    const [missionsResult, evaluationsResult] = await Promise.all([
      supabaseAdmin.from("missions").select("*").in("id", missionIds),
      supabaseAdmin.from("mission_evaluations").select("*").in("mission_id", missionIds),
    ]);

    if (missionsResult.error) {
      throw new Error(`Failed to load missions: ${missionsResult.error.message}`);
    }

    if (evaluationsResult.error) {
      throw new Error(
        `Failed to load mission evaluations: ${evaluationsResult.error.message}`
      );
    }

    missions = missionsResult.data ?? [];
    evaluations = evaluationsResult.data ?? [];
  }

  if (userIds.length > 0) {
    const { data, error } = await supabaseAdmin.from("users").select("*").in("id", userIds);

    if (error) {
      throw new Error(`Failed to load users: ${error.message}`);
    }

    users = data ?? [];
  }

  const missionMap = new Map(missions.map((mission) => [mission.id, mission]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const evaluationMap = new Map(
    evaluations.map((evaluation) => [evaluation.mission_id, evaluation])
  );

  const rows: AdminReportRow[] = reportRows.map((report) => ({
    report,
    mission: missionMap.get(report.mission_id) ?? null,
    user: userMap.get(report.user_id) ?? null,
    evaluation: evaluationMap.get(report.mission_id) ?? null,
  }));

  const totalReports = rows.length;
  const totalRga = rows.reduce((sum, row) => sum + (row.report.rga_count ?? 0), 0);
  const totalRevenue = rows.reduce(
    (sum, row) => sum + (row.report.revenue_amount ?? 0),
    0
  );
  const closingReports = rows.filter((row) => row.report.closing_status).length;
  const reportCode1Count = rows.filter((row) => row.report.report_code === "1").length;
  const reportCode2Count = rows.filter((row) => row.report.report_code === "2").length;
  const reportCode3Count = rows.filter((row) => row.report.report_code === "3").length;
  const reportCode4Count = rows.filter((row) => row.report.report_code === "4").length;

  return {
    filters,
    rows,
    summary: {
      totalReports,
      totalRga,
      averageRgaPerReport: totalReports > 0 ? totalRga / totalReports : 0,
      closingReports,
      totalRevenue,
      reportCode1Count,
      reportCode2Count,
      reportCode3Count,
      reportCode4Count,
    },
  };
}
