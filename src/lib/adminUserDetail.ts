import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type UserRow = Tables<"users">;
type BusinessProfileRow = Tables<"business_profiles">;
type ProductRow = Tables<"products">;
type MissionRow = Tables<"missions">;
type MissionItemRow = Tables<"mission_items">;
type MissionReportRow = Tables<"mission_reports">;
type MissionEvaluationRow = Tables<"mission_evaluations">;
type UserActivityLogRow = Tables<"user_activity_logs">;
type PaymentValidationRow = Tables<"payment_validations">;
type UserMissionSummaryRow = Tables<"v_user_mission_summary">;

export type AdminMissionDetail = {
  mission: MissionRow;
  items: MissionItemRow[];
  report: MissionReportRow | null;
  evaluation: MissionEvaluationRow | null;
};

export type AdminUserDetailData = {
  user: UserRow;
  businessProfile: BusinessProfileRow | null;
  productFocus: ProductRow | null;
  performanceSummary: UserMissionSummaryRow | null;
  latestMissions: AdminMissionDetail[];
  recentActivityLogs: UserActivityLogRow[];
  paymentValidations: PaymentValidationRow[];
};

function pickBusinessProfile(profiles: BusinessProfileRow[] | null) {
  if (!profiles?.length) {
    return null;
  }

  return (
    profiles.find((profile) => profile.status === "active") ??
    profiles[0] ??
    null
  );
}

function pickProduct(products: ProductRow[] | null) {
  if (!products?.length) {
    return null;
  }

  return (
    products.find((product) => product.is_primary) ??
    products[0] ??
    null
  );
}

export async function getAdminUserDetailData(
  userId: string
): Promise<AdminUserDetailData | null> {
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error(`Failed to load user: ${userError.message}`);
  }

  if (!user) {
    return null;
  }

  const [
    businessProfilesResult,
    productsResult,
    missionsResult,
    activityLogsResult,
    paymentValidationsResult,
    performanceSummaryResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("business_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .order("mission_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(7),
    supabaseAdmin
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("payment_validations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("v_user_mission_summary")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (businessProfilesResult.error) {
    throw new Error(
      `Failed to load business profiles: ${businessProfilesResult.error.message}`
    );
  }

  if (productsResult.error) {
    throw new Error(`Failed to load products: ${productsResult.error.message}`);
  }

  if (missionsResult.error) {
    throw new Error(`Failed to load missions: ${missionsResult.error.message}`);
  }

  if (activityLogsResult.error) {
    throw new Error(
      `Failed to load activity logs: ${activityLogsResult.error.message}`
    );
  }

  if (paymentValidationsResult.error) {
    throw new Error(
      `Failed to load payment validations: ${paymentValidationsResult.error.message}`
    );
  }

  const missions = missionsResult.data ?? [];
  const missionIds = missions.map((mission) => mission.id);

  let missionItems: MissionItemRow[] = [];
  let missionReports: MissionReportRow[] = [];
  let missionEvaluations: MissionEvaluationRow[] = [];

  if (missionIds.length > 0) {
    const [missionItemsResult, missionReportsResult, missionEvaluationsResult] =
      await Promise.all([
        supabaseAdmin
          .from("mission_items")
          .select("*")
          .eq("user_id", userId)
          .in("mission_id", missionIds)
          .order("mission_order", { ascending: true }),
        supabaseAdmin
          .from("mission_reports")
          .select("*")
          .eq("user_id", userId)
          .in("mission_id", missionIds)
          .order("reported_at", { ascending: false }),
        supabaseAdmin
          .from("mission_evaluations")
          .select("*")
          .eq("user_id", userId)
          .in("mission_id", missionIds)
          .order("created_at", { ascending: false }),
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

  const reportMap = new Map(missionReports.map((report) => [report.mission_id, report]));
  const evaluationMap = new Map(
    missionEvaluations.map((evaluation) => [evaluation.mission_id, evaluation])
  );
  const missionItemsMap = new Map<string, MissionItemRow[]>();

  for (const item of missionItems) {
    const currentItems = missionItemsMap.get(item.mission_id) ?? [];
    currentItems.push(item);
    missionItemsMap.set(item.mission_id, currentItems);
  }

  return {
    user,
    businessProfile: pickBusinessProfile(businessProfilesResult.data),
    productFocus: pickProduct(productsResult.data),
    performanceSummary: performanceSummaryResult.error
      ? null
      : performanceSummaryResult.data,
    latestMissions: missions.map((mission) => ({
      mission,
      items: missionItemsMap.get(mission.id) ?? [],
      report: reportMap.get(mission.id) ?? null,
      evaluation: evaluationMap.get(mission.id) ?? null,
    })),
    recentActivityLogs: activityLogsResult.data ?? [],
    paymentValidations: paymentValidationsResult.data ?? [],
  };
}
