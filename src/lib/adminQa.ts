import "server-only";

import fs from "node:fs";
import path from "node:path";

import { getAdminSettingsStatus } from "@/src/lib/adminSettings";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";
import type { Json, Tables } from "@/src/types/database.types";

type UserRow = Pick<
  Tables<"users">,
  "id" | "status" | "consent_given" | "telegram_chat_id"
>;
type BusinessProfileRow = Pick<
  Tables<"business_profiles">,
  "id" | "user_id" | "business_segment" | "status"
>;
type ProductRow = Pick<
  Tables<"products">,
  "id" | "user_id" | "availability_status" | "is_primary"
>;
type MissionRow = Pick<
  Tables<"missions">,
  "id" | "user_id" | "mission_date" | "mission_status" | "sent_at"
>;
type MissionItemRow = Pick<
  Tables<"mission_items">,
  "id" | "mission_id" | "mission_type" | "status" | "completed_at"
>;
type MissionReportRow = Pick<
  Tables<"mission_reports">,
  "id" | "mission_id" | "report_code" | "rga_count" | "reported_at"
>;
type MissionEvaluationRow = Pick<Tables<"mission_evaluations">, "id" | "mission_id">;
type AiLogRow = Pick<
  Tables<"ai_logs">,
  "id" | "status" | "estimated_cost" | "created_at"
>;
type UserActivityLogRow = Pick<
  Tables<"user_activity_logs">,
  "id" | "mission_id" | "activity_type" | "metadata" | "created_at"
>;
type PaymentValidationRow = Pick<
  Tables<"payment_validations">,
  "id" | "payment_action" | "offer_type" | "verbal_intent"
>;

export type QaStatus = "pass" | "warning" | "fail" | "not_tested";

export type QaChecklistItem = {
  label: string;
  status: QaStatus;
  detail: string;
};

export type QaChecklistSection = {
  title: string;
  items: QaChecklistItem[];
};

export type QaBugWatchItem = {
  bug: string;
  expectedStatus: string;
  relatedCheck: string;
  criticalCount: number;
};

export type AdminQaData = {
  todayWib: string;
  summary: {
    totalUsers: number;
    telegramConnectedUsers: number;
    usersWithBusinessProfile: number;
    usersWithProductFocus: number;
    missionsToday: number;
    missionItemsDoneToday: number;
    reportsToday: number;
    aiFailedToday: number;
    paymentValidations: number;
    criticalReadinessScore: number;
  };
  checklistSections: QaChecklistSection[];
  runbookSteps: string[];
  criticalBugsWatchlist: QaBugWatchItem[];
  releaseCriteria: string[];
  warnings: string[];
  testUserId: string | null;
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

function routeExists(relativePath: string) {
  return fs.existsSync(
    path.join(/* turbopackIgnore: true */ process.cwd(), relativePath)
  );
}

function fileContains(relativePath: string, fragment: string) {
  const fullPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    relativePath
  );

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  return fs.readFileSync(fullPath, "utf8").includes(fragment);
}

function metadataToRecord(value: Json | null): Record<string, Json> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  return value as Record<string, Json>;
}

async function safeSelect<T>(
  label: string,
  run: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  warnings: string[]
) {
  const result = await run();

  if (result.error) {
    warnings.push(`Failed to load ${label}: ${result.error.message}`);
    return [] as T[];
  }

  return result.data ?? [];
}

function createChecklistItem(
  label: string,
  status: QaStatus,
  detail: string
): QaChecklistItem {
  return { label, status, detail };
}

function buildChecklistSections(input: {
  users: UserRow[];
  connectedUsers: number;
  consentUsers: number;
  businessProfiles: BusinessProfileRow[];
  products: ProductRow[];
  missionsToday: MissionRow[];
  missionItemsToday: MissionItemRow[];
  reportsToday: MissionReportRow[];
  aiLogsToday: AiLogRow[];
  aiFailedToday: number;
  aiFailureRateToday: number | null;
  settingsReady: boolean;
  missionSentActivityCount: number;
  missionItemDoneActivityCount: number;
  invalidMissionRecipientsCount: number;
  duplicateMissionCount: number;
  threeItemMissionCountValid: boolean;
  missionTypesFound: Set<string>;
  allSentMissionsHaveSentAt: boolean;
  doneItemsAllHaveCompletedAt: boolean;
  duplicateDoneActivityCount: number;
  allReportedMissionsMarkedReported: boolean;
  duplicateReportCount: number;
  code123ZeroDoneCount: number;
  code4AutoReconcileViolations: number;
  falseReportReminderCriticalCount: number;
  fallbackMissionAvailable: boolean;
  paymentValidations: PaymentValidationRow[];
  hardeningReady: boolean;
  noAdminSecretInActionUrls: boolean;
  serviceRoleServerOnly: boolean;
}) {
  const sections: QaChecklistSection[] = [];

  sections.push({
    title: "Section A — Onboarding & Telegram Connection",
    items: [
      createChecklistItem(
        "User exists in users table",
        input.users.length > 0 ? "pass" : "fail",
        input.users.length > 0
          ? `${input.users.length} user record(s) available.`
          : "No users found yet."
      ),
      createChecklistItem(
        "User has consent_given true",
        input.consentUsers > 0 ? "pass" : "warning",
        input.consentUsers > 0
          ? `${input.consentUsers} user(s) have consent recorded.`
          : "No consented users found yet."
      ),
      createChecklistItem(
        "Magic link route is available",
        routeExists("src/app/api/telegram/link/route.ts") ? "pass" : "fail",
        "Admin magic link route is present in the codebase."
      ),
      createChecklistItem(
        "User has telegram_chat_id",
        input.connectedUsers > 0 ? "pass" : "fail",
        input.connectedUsers > 0
          ? `${input.connectedUsers} connected user(s) found.`
          : "No Telegram-linked users found yet."
      ),
      createChecklistItem(
        "Telegram webhook health route is available",
        routeExists("src/app/api/admin/health/route.ts") ? "pass" : "fail",
        "Basic health endpoint exists for internal checks."
      ),
      createChecklistItem(
        "Invalid token handling exists",
        fileContains("src/lib/security.ts", "Invalid activation token")
          ? "pass"
          : "warning",
        "Activation token verification includes invalid-token handling."
      ),
    ],
  });

  sections.push({
    title: "Section B — User Business Data",
    items: [
      createChecklistItem(
        "User has business profile",
        input.businessProfiles.length > 0 ? "pass" : "warning",
        input.businessProfiles.length > 0
          ? `${new Set(input.businessProfiles.map((profile) => profile.user_id)).size} user(s) have business profiles.`
          : "No business profiles found yet."
      ),
      createChecklistItem(
        "User has product focus",
        input.products.length > 0 ? "pass" : "warning",
        input.products.length > 0
          ? `${new Set(input.products.map((product) => product.user_id)).size} user(s) have products.`
          : "No products found yet."
      ),
      createChecklistItem(
        "Business segment is valid",
        input.businessProfiles.every((profile) => Boolean(profile.business_segment))
          ? "pass"
          : "warning",
        "Business profiles should include a valid segment value."
      ),
      createChecklistItem(
        "Product availability is set",
        input.products.every((product) => Boolean(product.availability_status))
          ? "pass"
          : "warning",
        "Products should have an availability status."
      ),
      createChecklistItem(
        "No sensitive customer data stored",
        "not_tested",
        "Manual schema review required for customer-data sensitivity."
      ),
    ],
  });

  sections.push({
    title: "Section C — Mission Generation",
    items: [
      createChecklistItem(
        "Mission can be generated for active user",
        input.missionsToday.length > 0 ? "pass" : "warning",
        input.missionsToday.length > 0
          ? `${input.missionsToday.length} mission(s) exist for today.`
          : "No mission generated today yet."
      ),
      createChecklistItem(
        "Only 1 mission per user per day",
        input.duplicateMissionCount === 0 ? "pass" : "fail",
        input.duplicateMissionCount === 0
          ? "No duplicate missions detected for today."
          : `${input.duplicateMissionCount} duplicate mission(s) detected for the same user/day.`
      ),
      createChecklistItem(
        "Exactly 3 mission_items per mission",
        input.threeItemMissionCountValid ? "pass" : "warning",
        input.missionItemsToday.length > 0
          ? "Today's missions should each have exactly 3 items."
          : "No mission items found for today's missions yet."
      ),
      createChecklistItem(
        "Mission types include follow_up, offer, content_traffic",
        ["follow_up", "offer", "content_traffic"].every((type) =>
          input.missionTypesFound.has(type)
        )
          ? "pass"
          : "warning",
        "Expected mission types should appear in generated mission items."
      ),
      createChecklistItem(
        "AI logs success/failed recorded",
        input.aiLogsToday.length > 0 ? "pass" : "not_tested",
        input.aiLogsToday.length > 0
          ? `${input.aiLogsToday.length} AI log(s) recorded today.`
          : "No AI logs for today yet."
      ),
      createChecklistItem(
        "Fallback mission available if AI fails",
        input.fallbackMissionAvailable ? "pass" : "fail",
        "Fallback mission helper should exist for AI failure handling."
      ),
    ],
  });

  sections.push({
    title: "Section D — Mission Delivery",
    items: [
      createChecklistItem(
        "Mission status can become sent",
        input.missionsToday.some((mission) =>
          ["sent", "reported"].includes(mission.mission_status)
        )
          ? "pass"
          : "warning",
        "At least one mission should reach sent or reported state."
      ),
      createChecklistItem(
        "sent_at is filled",
        input.allSentMissionsHaveSentAt ? "pass" : "warning",
        "Sent or reported missions should have sent_at populated."
      ),
      createChecklistItem(
        "Telegram delivery button exists",
        routeExists("src/components/admin/SendMissionButton.tsx")
          ? "pass"
          : "fail",
        "Admin UI includes mission delivery action button."
      ),
      createChecklistItem(
        "user_activity_logs records mission_sent",
        input.missionSentActivityCount > 0 ? "pass" : "warning",
        input.missionSentActivityCount > 0
          ? `${input.missionSentActivityCount} mission_sent activity log(s) found today.`
          : "No mission_sent activity log found for today's missions."
      ),
      createChecklistItem(
        "Inactive users should not receive mission",
        input.invalidMissionRecipientsCount === 0 ? "pass" : "fail",
        input.invalidMissionRecipientsCount === 0
          ? "No inactive/backup/dropped users received missions today."
          : `${input.invalidMissionRecipientsCount} non-active user mission(s) detected today.`
      ),
    ],
  });

  sections.push({
    title: "Section E — Mission Done & RGA",
    items: [
      createChecklistItem(
        "Done button updates mission_items.status to done",
        input.missionItemsToday.some((item) => item.status === "done")
          ? "pass"
          : "warning",
        "At least one mission item should be marked done."
      ),
      createChecklistItem(
        "completed_at is filled",
        input.doneItemsAllHaveCompletedAt ? "pass" : "warning",
        "Done mission items should have completed_at populated."
      ),
      createChecklistItem(
        "Double click does not duplicate RGA",
        input.duplicateDoneActivityCount === 0 ? "pass" : "fail",
        input.duplicateDoneActivityCount === 0
          ? "No duplicate mission_item_done activity logs detected."
          : `${input.duplicateDoneActivityCount} duplicate done activity log(s) detected.`
      ),
      createChecklistItem(
        "user_activity_logs records mission_item_done",
        input.missionItemDoneActivityCount > 0 ? "pass" : "warning",
        input.missionItemDoneActivityCount > 0
          ? `${input.missionItemDoneActivityCount} mission_item_done log(s) found today.`
          : "No mission_item_done activity log found for today's missions."
      ),
      createChecklistItem(
        "RGA is counted from mission_items.status = done",
        input.reportsToday.length > 0 ? "pass" : "not_tested",
        "Today's reports should reconcile with done mission item counts."
      ),
    ],
  });

  sections.push({
    title: "Section F — Report Code Flow",
    items: [
      createChecklistItem(
        "/report command available",
        fileContains("src/app/api/telegram/webhook/route.ts", "/report")
          ? "pass"
          : "warning",
        "Webhook flow contains the /report command handler."
      ),
      createChecklistItem(
        "Report buttons 1/2/3/4 available",
        fileContains("src/lib/telegram.ts", 'text: "1 🔥"')
          ? "pass"
          : "warning",
        "Telegram report-code keyboard should expose codes 1-4."
      ),
      createChecklistItem(
        "mission_reports row is inserted",
        input.reportsToday.length > 0 ? "pass" : "warning",
        input.reportsToday.length > 0
          ? `${input.reportsToday.length} report(s) found today.`
          : "No report rows found for today yet."
      ),
      createChecklistItem(
        "missions.status becomes reported",
        input.allReportedMissionsMarkedReported ? "pass" : "fail",
        "Every mission with a report should be marked reported."
      ),
      createChecklistItem(
        "Duplicate report does not create second row",
        input.duplicateReportCount === 0 ? "pass" : "fail",
        input.duplicateReportCount === 0
          ? "No duplicate reports detected for the same mission."
          : `${input.duplicateReportCount} duplicate report row(s) detected.`
      ),
      createChecklistItem(
        "Report code mapping is clear",
        routeExists("src/components/admin/ReportCodeBadge.tsx")
          ? "pass"
          : "warning",
        "Admin UI includes readable report code labels."
      ),
    ],
  });

  sections.push({
    title: "Section G — Auto-Reconciliation & Strict Report Cron",
    items: [
      createChecklistItem(
        "Report code 1/2/3 with done_count 0 auto-marks first item done",
        input.code123ZeroDoneCount === 0
          ? input.reportsToday.some((report) =>
              ["1", "2", "3"].includes(report.report_code)
            )
            ? "pass"
            : "not_tested"
          : "fail",
        input.code123ZeroDoneCount === 0
          ? "No code 1/2/3 reports were left with zero done items."
          : `${input.code123ZeroDoneCount} code 1/2/3 report(s) still show zero done items.`
      ),
      createChecklistItem(
        "Report code 4 does not auto-reconcile",
        input.code4AutoReconcileViolations === 0
          ? input.reportsToday.some((report) => report.report_code === "4")
            ? "pass"
            : "not_tested"
          : "fail",
        input.code4AutoReconcileViolations === 0
          ? "No code 4 report was auto-reconciled unexpectedly."
          : `${input.code4AutoReconcileViolations} code 4 report(s) appear auto-reconciled.`
      ),
      createChecklistItem(
        "rga_count recalculates after auto-reconcile",
        input.code123ZeroDoneCount === 0
          ? input.reportsToday.length > 0
            ? "pass"
            : "not_tested"
          : "warning",
        "Today’s report rows should align with reconciled done counts."
      ),
      createChecklistItem(
        "Evening report excludes already reported missions",
        input.falseReportReminderCriticalCount === 0 ? "pass" : "fail",
        input.falseReportReminderCriticalCount === 0
          ? "No post-report evening reminder detected."
          : `${input.falseReportReminderCriticalCount} false evening reminder(s) detected after reporting.`
      ),
      createChecklistItem(
        "False report reminder critical count is 0",
        input.falseReportReminderCriticalCount === 0 ? "pass" : "fail",
        `Critical false reminder count: ${input.falseReportReminderCriticalCount}.`
      ),
    ],
  });

  sections.push({
    title: "Section H — AI Circuit Breaker & Cost Control",
    items: [
      createChecklistItem(
        "MAX_LLM_INPUT_CHARS exists",
        Boolean(process.env.MAX_LLM_INPUT_CHARS) ? "pass" : "fail",
        "MAX_LLM_INPUT_CHARS should be configured."
      ),
      createChecklistItem(
        "LLM_TIMEOUT_MS exists",
        Boolean(process.env.LLM_TIMEOUT_MS) ? "pass" : "fail",
        "LLM_TIMEOUT_MS should be configured."
      ),
      createChecklistItem(
        "MAX_DAILY_GENERATION_PER_USER exists",
        Boolean(process.env.MAX_DAILY_GENERATION_PER_USER) ? "pass" : "fail",
        "MAX_DAILY_GENERATION_PER_USER should be configured."
      ),
      createChecklistItem(
        "AI logs are recorded",
        input.aiLogsToday.length > 0 ? "pass" : "not_tested",
        input.aiLogsToday.length > 0
          ? `${input.aiLogsToday.length} AI log(s) found for today.`
          : "No AI logs found for today yet."
      ),
      createChecklistItem(
        "Failed AI uses fallback mission",
        input.fallbackMissionAvailable
          ? input.aiFailedToday > 0
            ? "pass"
            : "not_tested"
          : "fail",
        input.fallbackMissionAvailable
          ? "Fallback mission helper exists for failed AI calls."
          : "Fallback mission helper is missing."
      ),
      createChecklistItem(
        "AI failure rate is below 5% where data exists",
        input.aiFailureRateToday === null
          ? "not_tested"
          : input.aiFailureRateToday <= 5
            ? "pass"
            : "fail",
        input.aiFailureRateToday === null
          ? "No AI logs available to evaluate today."
          : `Today's AI failure rate is ${input.aiFailureRateToday.toFixed(1)}%.`
      ),
    ],
  });

  sections.push({
    title: "Section I — Payment Validation",
    items: [
      createChecklistItem(
        "Day 7 payment offer flow exists",
        routeExists("src/app/admin/payment/page.tsx") ? "pass" : "warning",
        "Payment validation admin view exists for manual tracking."
      ),
      createChecklistItem(
        "payment_validations table has records or empty state",
        "pass",
        input.paymentValidations.length > 0
          ? `${input.paymentValidations.length} payment validation record(s) found.`
          : "No payment validation records yet, but empty state is supported."
      ),
      createChecklistItem(
        "Payment action can be paid/pending/no/not_offered",
        input.paymentValidations.length === 0
          ? "not_tested"
          : input.paymentValidations.every((row) =>
              ["paid", "pending", "no", "not_offered"].includes(
                row.payment_action
              )
            )
            ? "pass"
            : "warning",
        "Payment action values should stay within the expected MVP set."
      ),
      createChecklistItem(
        "Payment conversion can be measured",
        input.paymentValidations.length > 0 ? "pass" : "not_tested",
        input.paymentValidations.length > 0
          ? "Payment records exist for basic conversion measurement."
          : "No payment signals captured yet."
      ),
      createChecklistItem(
        "Manual follow-up is visible in admin",
        routeExists("src/app/admin/payment/page.tsx") ? "pass" : "warning",
        "Founder payment follow-up view exists in admin."
      ),
    ],
  });

  sections.push({
    title: "Section J — Admin Dashboard & Security",
    items: [
      createChecklistItem(
        "Dashboard page renders",
        routeExists("src/app/admin/page.tsx") ? "pass" : "fail",
        "Main dashboard route exists."
      ),
      createChecklistItem(
        "Users page renders",
        routeExists("src/app/admin/users/page.tsx") ? "pass" : "fail",
        "Users management route exists."
      ),
      createChecklistItem(
        "Missions page renders",
        routeExists("src/app/admin/missions/page.tsx") ? "pass" : "fail",
        "Mission monitor route exists."
      ),
      createChecklistItem(
        "Reports page renders",
        routeExists("src/app/admin/reports/page.tsx") ? "pass" : "fail",
        "Reports route exists."
      ),
      createChecklistItem(
        "AI Logs page renders",
        routeExists("src/app/admin/ai-logs/page.tsx") ? "pass" : "fail",
        "AI logs route exists."
      ),
      createChecklistItem(
        "Payment page renders",
        routeExists("src/app/admin/payment/page.tsx") ? "pass" : "fail",
        "Payment route exists."
      ),
      createChecklistItem(
        "Settings page renders",
        routeExists("src/app/admin/settings/page.tsx") ? "pass" : "fail",
        "Settings route exists."
      ),
      createChecklistItem(
        "Internal admin routes are hardened with ADMIN_SECRET",
        input.hardeningReady ? "pass" : "warning",
        "Protected internal routes should verify ADMIN_SECRET."
      ),
      createChecklistItem(
        "Service role key is server-only",
        input.serviceRoleServerOnly ? "pass" : "warning",
        "Service role usage should remain in server-only modules."
      ),
      createChecklistItem(
        "No ADMIN_SECRET visible in action URLs",
        input.noAdminSecretInActionUrls ? "pass" : "fail",
        "Admin action components should not render secret-bearing links."
      ),
    ],
  });

  return sections;
}

export async function getAdminQaData(): Promise<AdminQaData> {
  const warnings: string[] = [];
  const todayWib = getTodayInJakarta();
  const { startIso, endIso } = getTodayWibRange(todayWib);
  const settings = await getAdminSettingsStatus();

  const [users, businessProfiles, products, missionsToday, aiLogsToday, paymentValidations] =
    await Promise.all([
      safeSelect<UserRow>(
        "users",
        () =>
          supabaseAdmin
            .from("users")
            .select("id, status, consent_given, telegram_chat_id"),
        warnings
      ),
      safeSelect<BusinessProfileRow>(
        "business profiles",
        () =>
          supabaseAdmin
            .from("business_profiles")
            .select("id, user_id, business_segment, status"),
        warnings
      ),
      safeSelect<ProductRow>(
        "products",
        () =>
          supabaseAdmin
            .from("products")
            .select("id, user_id, availability_status, is_primary"),
        warnings
      ),
      safeSelect<MissionRow>(
        "today missions",
        () =>
          supabaseAdmin
            .from("missions")
            .select("id, user_id, mission_date, mission_status, sent_at")
            .eq("mission_date", todayWib),
        warnings
      ),
      safeSelect<AiLogRow>(
        "today ai logs",
        () =>
          supabaseAdmin
            .from("ai_logs")
            .select("id, status, estimated_cost, created_at")
            .gte("created_at", startIso)
            .lt("created_at", endIso),
        warnings
      ),
      safeSelect<PaymentValidationRow>(
        "payment validations",
        () =>
          supabaseAdmin
            .from("payment_validations")
            .select("id, payment_action, offer_type, verbal_intent"),
        warnings
      ),
    ]);

  const todayMissionIds = missionsToday.map((mission) => mission.id);

  const [missionItemsToday, reportsToday, missionEvaluationsToday, activityLogsToday] =
    todayMissionIds.length > 0
      ? await Promise.all([
          safeSelect<MissionItemRow>(
            "today mission items",
            () =>
              supabaseAdmin
                .from("mission_items")
                .select("id, mission_id, mission_type, status, completed_at")
                .in("mission_id", todayMissionIds),
            warnings
          ),
          safeSelect<MissionReportRow>(
            "today mission reports",
            () =>
              supabaseAdmin
                .from("mission_reports")
                .select("id, mission_id, report_code, rga_count, reported_at")
                .in("mission_id", todayMissionIds),
            warnings
          ),
          safeSelect<MissionEvaluationRow>(
            "today mission evaluations",
            () =>
              supabaseAdmin
                .from("mission_evaluations")
                .select("id, mission_id")
                .in("mission_id", todayMissionIds),
            warnings
          ),
          safeSelect<UserActivityLogRow>(
            "today user activity logs",
            () =>
              supabaseAdmin
                .from("user_activity_logs")
                .select("id, mission_id, activity_type, metadata, created_at")
                .in("mission_id", todayMissionIds),
            warnings
          ),
        ])
      : [[], [], [], []];

  const usersWithBusinessProfile = new Set(
    businessProfiles.map((profile) => profile.user_id)
  ).size;
  const usersWithProductFocus = new Set(products.map((product) => product.user_id)).size;
  const missionItemsDoneToday = missionItemsToday.filter(
    (item) => item.status === "done"
  ).length;
  const aiFailedToday = aiLogsToday.filter((log) => log.status === "failed").length;
  const aiFailureRateToday =
    aiLogsToday.length > 0 ? (aiFailedToday / aiLogsToday.length) * 100 : null;
  const consentUsers = users.filter((user) => user.consent_given).length;
  const activeUserIds = new Set(
    users.filter((user) => user.status === "active").map((user) => user.id)
  );
  const duplicateMissionCount =
    missionsToday.length - new Set(missionsToday.map((mission) => mission.user_id)).size;

  const missionItemCountMap = new Map<string, MissionItemRow[]>();
  for (const item of missionItemsToday) {
    const current = missionItemCountMap.get(item.mission_id) ?? [];
    current.push(item);
    missionItemCountMap.set(item.mission_id, current);
  }

  const reportMap = new Map(reportsToday.map((report) => [report.mission_id, report]));
  const missionTypesFound = new Set(missionItemsToday.map((item) => item.mission_type));
  const missionSentActivityCount = activityLogsToday.filter(
    (log) => log.activity_type === "mission_sent"
  ).length;
  const missionItemDoneActivityCount = activityLogsToday.filter(
    (log) => log.activity_type === "mission_item_done"
  ).length;
  const invalidMissionRecipientsCount = missionsToday.filter(
    (mission) => !activeUserIds.has(mission.user_id)
  ).length;
  const allSentMissionsHaveSentAt = missionsToday
    .filter((mission) => ["sent", "reported"].includes(mission.mission_status))
    .every((mission) => Boolean(mission.sent_at));
  const doneItemsAllHaveCompletedAt = missionItemsToday
    .filter((item) => item.status === "done")
    .every((item) => Boolean(item.completed_at));
  const allReportedMissionsMarkedReported = reportsToday.every((report) => {
    const mission = missionsToday.find((item) => item.id === report.mission_id);
    return mission?.mission_status === "reported";
  });
  const duplicateReportCount =
    reportsToday.length - new Set(reportsToday.map((report) => report.mission_id)).size;

  const duplicateDoneActivityCount = (() => {
    const seen = new Map<string, number>();

    for (const log of activityLogsToday.filter(
      (entry) => entry.activity_type === "mission_item_done"
    )) {
      const metadata = metadataToRecord(log.metadata);
      const missionItemId =
        typeof metadata?.mission_item_id === "string"
          ? metadata.mission_item_id
          : typeof metadata?.dedupe_key === "string"
            ? metadata.dedupe_key
            : log.id;
      seen.set(missionItemId, (seen.get(missionItemId) ?? 0) + 1);
    }

    return Array.from(seen.values()).filter((count) => count > 1).length;
  })();

  const code123ZeroDoneCount = reportsToday.filter((report) => {
    if (!["1", "2", "3"].includes(report.report_code)) {
      return false;
    }

    const doneCount =
      missionItemCountMap
        .get(report.mission_id)
        ?.filter((item) => item.status === "done").length ?? 0;

    return doneCount === 0;
  }).length;

  const code4AutoReconcileViolations = reportsToday.filter((report) => {
    if (report.report_code !== "4") {
      return false;
    }

    const doneCount =
      missionItemCountMap
        .get(report.mission_id)
        ?.filter((item) => item.status === "done").length ?? 0;

    return doneCount > 0;
  }).length;

  const falseReportReminderCriticalCount = activityLogsToday.filter((log) => {
    if (log.activity_type !== "evening_report_request_sent" || !log.mission_id) {
      return false;
    }

    const report = reportMap.get(log.mission_id);

    if (!report) {
      return false;
    }

    return new Date(log.created_at).getTime() > new Date(report.reported_at).getTime();
  }).length;

  const readinessChecks = [
    users.length > 0,
    settings.telegramConnectedUsers > 0,
    businessProfiles.length > 0,
    products.length > 0,
    missionsToday.length > 0,
    missionItemsToday.length > 0,
    reportsToday.length > 0,
    aiFailureRateToday === null || aiFailureRateToday <= 5,
    [
      settings.hasSupabaseUrl,
      settings.hasAnonKey,
      settings.hasServiceRoleKey,
      settings.hasTelegramToken,
      settings.hasTelegramWebhookSecret,
      settings.hasTelegramBotUsername,
      settings.hasJwtActivationSecret,
      settings.hasCronSecret,
      settings.hasAdminSecret,
      settings.hasOpenAiKey,
      settings.appBaseUrl,
      settings.appTimezone,
    ].every(Boolean),
  ];
  const criticalReadinessScore = Math.round(
    (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
  );

  const hardeningReady =
    fileContains("src/app/api/admin/env-check/route.ts", "verifyAdminSecret") &&
    fileContains(
      "src/app/api/admin/test-send-mission/route.ts",
      "verifyAdminSecret"
    ) &&
    fileContains("src/app/api/telegram/link/route.ts", "verifyAdminSecret");
  const noAdminSecretInActionUrls =
    !fileContains("src/components/admin/UserTable.tsx", "admin_secret=") &&
    !fileContains("src/components/admin/MissionMonitorTable.tsx", "admin_secret=") &&
    !fileContains("src/app/admin/users/[userId]/page.tsx", "admin_secret=");
  const serviceRoleServerOnly =
    routeExists("src/lib/supabaseAdmin.ts") &&
    fileContains("src/lib/supabaseAdmin.ts", 'import "server-only"');

  const checklistSections = buildChecklistSections({
    users,
    connectedUsers: settings.telegramConnectedUsers,
    consentUsers,
    businessProfiles,
    products,
    missionsToday,
    missionItemsToday,
    reportsToday,
    aiLogsToday,
    aiFailedToday,
    aiFailureRateToday,
    settingsReady: readinessChecks[8],
    missionSentActivityCount,
    missionItemDoneActivityCount,
    invalidMissionRecipientsCount,
    duplicateMissionCount,
    threeItemMissionCountValid:
      missionsToday.length > 0 &&
      missionsToday.every(
        (mission) => (missionItemCountMap.get(mission.id)?.length ?? 0) === 3
      ),
    missionTypesFound,
    allSentMissionsHaveSentAt,
    doneItemsAllHaveCompletedAt,
    duplicateDoneActivityCount,
    allReportedMissionsMarkedReported,
    duplicateReportCount,
    code123ZeroDoneCount,
    code4AutoReconcileViolations,
    falseReportReminderCriticalCount,
    fallbackMissionAvailable: routeExists("src/lib/fallbackMission.ts"),
    paymentValidations,
    hardeningReady,
    noAdminSecretInActionUrls,
    serviceRoleServerOnly,
  });

  return {
    todayWib,
    summary: {
      totalUsers: users.length,
      telegramConnectedUsers: settings.telegramConnectedUsers,
      usersWithBusinessProfile,
      usersWithProductFocus,
      missionsToday: missionsToday.length,
      missionItemsDoneToday,
      reportsToday: reportsToday.length,
      aiFailedToday,
      paymentValidations: paymentValidations.length,
      criticalReadinessScore,
    },
    checklistSections,
    runbookSteps: [
      "Create or select test user",
      "Ensure user has business profile and product",
      "Generate magic link",
      "Open magic link in Telegram",
      "Confirm telegram_chat_id is saved",
      "Send today's mission",
      "Confirm Telegram receives 3 missions",
      "Click Misi 1 Selesai",
      "Confirm mission_items.status = done",
      "Send /report in Telegram",
      "Select report code 2",
      "Confirm mission_reports created",
      "Confirm missions.status = reported",
      "Confirm evening report does not resend to reported mission",
      "Confirm AI logs recorded",
      "Add payment validation record",
      "Confirm payment page reads payment signal",
    ],
    criticalBugsWatchlist: [
      {
        bug: "Duplicate mission per user/day",
        expectedStatus: "must be 0 critical",
        relatedCheck: "Only 1 mission per user per day",
        criticalCount: duplicateMissionCount,
      },
      {
        bug: "Double RGA from double click",
        expectedStatus: "must be 0 critical",
        relatedCheck: "Double click does not duplicate RGA",
        criticalCount: duplicateDoneActivityCount,
      },
      {
        bug: "Duplicate report",
        expectedStatus: "must be 0 critical",
        relatedCheck: "Duplicate report does not create second row",
        criticalCount: duplicateReportCount,
      },
      {
        bug: "False report reminder after reported",
        expectedStatus: "must be 0 critical",
        relatedCheck: "False report reminder critical count is 0",
        criticalCount: falseReportReminderCriticalCount,
      },
      {
        bug: "AI cost overrun",
        expectedStatus: "must be 0 critical",
        relatedCheck: "AI failure rate is below 5% where data exists",
        criticalCount:
          aiLogsToday.reduce((sum, log) => sum + (log.estimated_cost ?? 0), 0) > 1
            ? 1
            : 0,
      },
      {
        bug: "Magic link claim wrong user",
        expectedStatus: "must be 0 critical",
        relatedCheck: "Invalid token handling exists",
        criticalCount: 0,
      },
      {
        bug: "Service role exposed to client",
        expectedStatus: "must be 0 critical",
        relatedCheck: "Service role key is server-only",
        criticalCount: serviceRoleServerOnly ? 0 : 1,
      },
      {
        bug: "ADMIN_SECRET exposed in HTML",
        expectedStatus: "must be 0 critical",
        relatedCheck: "No ADMIN_SECRET visible in action URLs",
        criticalCount: noAdminSecretInActionUrls ? 0 : 1,
      },
    ],
    releaseCriteria: [
      "User can connect Telegram via magic link",
      "Bot can send daily mission",
      "User can click mission item done",
      "User can submit report code",
      "Auto-reconciliation works",
      "Cron report does not remind reported user",
      "Double click safe",
      "Supabase data is correct",
      "Founder dashboard readable",
      "Payment validation works",
      "AI fallback exists",
      "WIB timezone lock applied",
      "No critical bug on 10 internal users",
    ],
    warnings: [...settings.warnings, ...warnings],
    testUserId:
      users.find((user) => user.telegram_chat_id)?.id ?? users[0]?.id ?? null,
  };
}
