import "server-only";

import { getTodayInJakarta } from "@/src/lib/time";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type UserRow = Pick<
  Tables<"users">,
  | "id"
  | "full_name"
  | "whatsapp_number"
  | "cohort_name"
  | "consent_given"
  | "telegram_chat_id"
  | "telegram_username"
  | "status"
>;
type BusinessProfileRow = Pick<Tables<"business_profiles">, "id" | "user_id" | "status">;
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
  "id" | "mission_id" | "status" | "completed_at"
>;
type MissionReportRow = Pick<
  Tables<"mission_reports">,
  "id" | "mission_id" | "user_id" | "report_code" | "reported_at"
>;
type MissionEvaluationRow = Pick<Tables<"mission_evaluations">, "id" | "mission_id">;
type UserActivityLogRow = Pick<
  Tables<"user_activity_logs">,
  "id" | "user_id" | "mission_id" | "activity_type"
>;
type PaymentValidationRow = Pick<
  Tables<"payment_validations">,
  "id" | "user_id" | "verbal_intent" | "payment_action" | "offer_type" | "created_at"
>;

export type DogfoodingStatusFilter =
  | "all"
  | "ready"
  | "onboarding_stuck"
  | "telegram_connected"
  | "mission_sent"
  | "moved"
  | "reported"
  | "payment_signal"
  | "needs_follow_up";

export type DogfoodingFilters = {
  cohort: string;
  status: DogfoodingStatusFilter;
  date: string;
};

export type DogfoodingUserRowData = {
  userId: string;
  name: string;
  whatsapp: string;
  cohort: string;
  telegramUsername: string | null;
  hasBusinessProfile: boolean;
  hasProductFocus: boolean;
  consentGiven: boolean;
  telegramConnected: boolean;
  missionStatusLabel: "Belum Ada" | "Draft" | "Terkirim" | "Sudah Dilaporkan";
  sentAt: string | null;
  doneItemsCount: number;
  salesActionLabel: "Belum Bergerak" | "Mulai Bergerak" | "Aktif Bergerak";
  hasReportToday: boolean;
  reportCode: string | null;
  reportCodeLabel: string;
  paymentSignalLabel: "Paid" | "Pending" | "Tertarik" | "Belum Ada" | "Tidak Lanjut";
  readyToTest: boolean;
  needsFollowUp: boolean;
  followUpRecommendation: string;
};

export type DogfoodingQueueItem = {
  userId: string;
  name: string;
  note: string;
};

export type DogfoodingFunnelStep = {
  label: string;
  count: number;
  percentage: number;
};

export type AdminDogfoodingData = {
  filters: DogfoodingFilters;
  summary: {
    totalTester: number;
    siapDiuji: number;
    telegramTerhubung: number;
    misiTerkirimHariIni: number;
    sudahBergerakHariIni: number;
    sudahLaporHariIni: number;
    perluFollowUp: number;
    adaSinyalBayar: number;
  };
  funnel: DogfoodingFunnelStep[];
  testers: DogfoodingUserRowData[];
  focusQueues: {
    onboardingStuck: DogfoodingQueueItem[];
    belumBergerak: DogfoodingQueueItem[];
    belumLapor: DogfoodingQueueItem[];
    sinyalBayar: DogfoodingQueueItem[];
  };
  warnings: string[];
};

const STATUS_FILTERS = new Set<DogfoodingStatusFilter>([
  "all",
  "ready",
  "onboarding_stuck",
  "telegram_connected",
  "mission_sent",
  "moved",
  "reported",
  "payment_signal",
  "needs_follow_up",
]);

function isValidDateString(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function normalizeFilters(input: {
  cohort?: string;
  status?: string;
  date?: string;
}): DogfoodingFilters {
  return {
    cohort: input.cohort?.trim() || "alpha_batch_1",
    status: STATUS_FILTERS.has(input.status as DogfoodingStatusFilter)
      ? (input.status as DogfoodingStatusFilter)
      : "all",
    date: isValidDateString(input.date) ? input.date : getTodayInJakarta(),
  };
}

async function safeSelect<T>(
  label: string,
  run: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  warnings: string[]
) {
  const result = await run();

  if (result.error) {
    warnings.push(`Gagal memuat ${label}: ${result.error.message}`);
    return [] as T[];
  }

  return result.data ?? [];
}

function mapMissionStatusLabel(
  mission: MissionRow | null
): DogfoodingUserRowData["missionStatusLabel"] {
  if (!mission) {
    return "Belum Ada";
  }

  switch (mission.mission_status) {
    case "drafted":
      return "Draft";
    case "sent":
      return "Terkirim";
    case "reported":
      return "Sudah Dilaporkan";
    default:
      return "Belum Ada";
  }
}

function mapSalesActionLabel(doneItemsCount: number): DogfoodingUserRowData["salesActionLabel"] {
  if (doneItemsCount === 0) {
    return "Belum Bergerak";
  }

  if (doneItemsCount === 1) {
    return "Mulai Bergerak";
  }

  return "Aktif Bergerak";
}

function mapReportCodeLabel(reportCode: string | null) {
  switch (reportCode) {
    case "1":
      return "Ada Closing";
    case "2":
      return "Ada Respon";
    case "3":
      return "Sudah Aksi, Belum Respon";
    case "4":
      return "Belum Sempat";
    default:
      return "-";
  }
}

function mapPaymentSignalLabel(payment: PaymentValidationRow | null) {
  if (!payment) {
    return "Belum Ada";
  }

  if (payment.payment_action === "paid") {
    return "Paid";
  }

  if (payment.payment_action === "pending") {
    return "Pending";
  }

  if (payment.payment_action === "no") {
    return "Tidak Lanjut";
  }

  if (payment.verbal_intent === "yes" || payment.verbal_intent === "maybe") {
    return "Tertarik";
  }

  return "Belum Ada";
}

function getFollowUpRecommendation(input: {
  hasBusinessProfile: boolean;
  hasProductFocus: boolean;
  consentGiven: boolean;
  telegramConnected: boolean;
  missionToday: MissionRow | null;
  doneItemsCount: number;
  hasReportToday: boolean;
  reportCode: string | null;
  payment: PaymentValidationRow | null;
}) {
  if (!input.hasBusinessProfile || !input.hasProductFocus || !input.consentGiven) {
    return "Lengkapi data bisnis dulu.";
  }

  if (!input.telegramConnected) {
    return "Kirim magic link Telegram.";
  }

  if (!input.missionToday) {
    return "Kirim misi hari ini.";
  }

  if (
    ["sent", "reported"].includes(input.missionToday.mission_status) &&
    input.doneItemsCount === 0
  ) {
    return "Ingatkan mulai dari 1 misi ringan.";
  }

  if (input.doneItemsCount > 0 && !input.hasReportToday) {
    return "Minta laporan singkat.";
  }

  if (input.reportCode === "2") {
    return "Bantu follow up respon.";
  }

  if (input.reportCode === "4") {
    return "Besok beri misi lebih ringan.";
  }

  if (input.payment?.payment_action === "pending") {
    return "Follow up pembayaran.";
  }

  if (input.payment?.payment_action === "paid") {
    return "Jaga retensi dan minta feedback.";
  }

  return "Pantau progres harian tester ini.";
}

function percentage(count: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function matchesStatusFilter(
  row: DogfoodingUserRowData,
  status: DogfoodingStatusFilter
) {
  if (status === "all") {
    return true;
  }

  switch (status) {
    case "ready":
      return row.readyToTest;
    case "onboarding_stuck":
      return !row.readyToTest || !row.telegramConnected;
    case "telegram_connected":
      return row.telegramConnected;
    case "mission_sent":
      return ["Terkirim", "Sudah Dilaporkan"].includes(row.missionStatusLabel);
    case "moved":
      return row.doneItemsCount > 0;
    case "reported":
      return row.hasReportToday;
    case "payment_signal":
      return ["Paid", "Pending", "Tertarik"].includes(row.paymentSignalLabel);
    case "needs_follow_up":
      return row.needsFollowUp;
    default:
      return true;
  }
}

export async function getAdminDogfoodingData(input: {
  cohort?: string;
  status?: string;
  date?: string;
}): Promise<AdminDogfoodingData> {
  const filters = normalizeFilters(input);
  const warnings: string[] = [];

  const users = await safeSelect<UserRow>(
    "tester",
    () =>
      supabaseAdmin
        .from("users")
        .select(
          "id, full_name, whatsapp_number, cohort_name, consent_given, telegram_chat_id, telegram_username, status"
        )
        .ilike("cohort_name", `%${filters.cohort}%`)
        .order("created_at", { ascending: false }),
    warnings
  );

  if (users.length === 0) {
    return {
      filters,
      summary: {
        totalTester: 0,
        siapDiuji: 0,
        telegramTerhubung: 0,
        misiTerkirimHariIni: 0,
        sudahBergerakHariIni: 0,
        sudahLaporHariIni: 0,
        perluFollowUp: 0,
        adaSinyalBayar: 0,
      },
      funnel: [
        "Data Tester Masuk",
        "Profil Bisnis Lengkap",
        "Produk Fokus Siap",
        "Telegram Terhubung",
        "Misi Dikirim",
        "Aksi Jualan Selesai",
        "Laporan Masuk",
        "Sinyal Bayar",
      ].map((label) => ({ label, count: 0, percentage: 0 })),
      testers: [],
      focusQueues: {
        onboardingStuck: [],
        belumBergerak: [],
        belumLapor: [],
        sinyalBayar: [],
      },
      warnings,
    };
  }

  const userIds = users.map((user) => user.id);

  const [
    businessProfiles,
    products,
    missions,
    missionItems,
    missionReports,
    missionEvaluations,
    userActivityLogs,
    paymentValidations,
  ] = await Promise.all([
    safeSelect<BusinessProfileRow>(
      "profil bisnis",
      () =>
        supabaseAdmin
          .from("business_profiles")
          .select("id, user_id, status")
          .in("user_id", userIds),
      warnings
    ),
    safeSelect<ProductRow>(
      "produk fokus",
      () =>
        supabaseAdmin
          .from("products")
          .select("id, user_id, availability_status, is_primary")
          .in("user_id", userIds),
      warnings
    ),
    safeSelect<MissionRow>(
      "misi",
      () =>
        supabaseAdmin
          .from("missions")
          .select("id, user_id, mission_date, mission_status, sent_at")
          .eq("mission_date", filters.date)
          .in("user_id", userIds),
      warnings
    ),
    safeSelect<MissionItemRow>(
      "aksi jualan",
      () =>
        supabaseAdmin
          .from("mission_items")
          .select("id, mission_id, status, completed_at")
          .in(
            "mission_id",
            supabaseAdmin
              .from("missions")
              .select("id")
              .eq("mission_date", filters.date)
              .in("user_id", userIds)
          ) as never,
      warnings
    ),
    safeSelect<MissionReportRow>(
      "laporan",
      () =>
        supabaseAdmin
          .from("mission_reports")
          .select("id, mission_id, user_id, report_code, reported_at")
          .in("user_id", userIds)
          .gte("reported_at", `${filters.date}T00:00:00+07:00`)
          .lt("reported_at", `${filters.date}T23:59:59.999+07:00`),
      warnings
    ),
    safeSelect<MissionEvaluationRow>(
      "evaluasi misi",
      () =>
        supabaseAdmin
          .from("mission_evaluations")
          .select("id, mission_id")
          .in("user_id", userIds),
      warnings
    ),
    safeSelect<UserActivityLogRow>(
      "aktivitas tester",
      () =>
        supabaseAdmin
          .from("user_activity_logs")
          .select("id, user_id, mission_id, activity_type")
          .in("user_id", userIds),
      warnings
    ),
    safeSelect<PaymentValidationRow>(
      "sinyal bayar",
      () =>
        supabaseAdmin
          .from("payment_validations")
          .select("id, user_id, verbal_intent, payment_action, offer_type, created_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false }),
      warnings
    ),
  ]);

  const businessProfileMap = new Map<string, BusinessProfileRow>();
  for (const profile of businessProfiles) {
    const existing = businessProfileMap.get(profile.user_id);

    if (!existing || profile.status === "active") {
      businessProfileMap.set(profile.user_id, profile);
    }
  }

  const productMap = new Map<string, ProductRow>();
  for (const product of products) {
    const existing = productMap.get(product.user_id);

    if (!existing || product.is_primary) {
      productMap.set(product.user_id, product);
    }
  }

  const missionMap = new Map<string, MissionRow>();
  for (const mission of missions) {
    missionMap.set(mission.user_id, mission);
  }

  const missionIds = missions.map((mission) => mission.id);
  const missionItemsByMissionId = new Map<string, MissionItemRow[]>();
  for (const item of missionItems.filter((item) => missionIds.includes(item.mission_id))) {
    const current = missionItemsByMissionId.get(item.mission_id) ?? [];
    current.push(item);
    missionItemsByMissionId.set(item.mission_id, current);
  }

  const reportByUserId = new Map<string, MissionReportRow>();
  for (const report of missionReports) {
    reportByUserId.set(report.user_id, report);
  }

  const latestPaymentByUserId = new Map<string, PaymentValidationRow>();
  for (const payment of paymentValidations) {
    if (!latestPaymentByUserId.has(payment.user_id)) {
      latestPaymentByUserId.set(payment.user_id, payment);
    }
  }

  const testers = users
    .map<DogfoodingUserRowData>((user) => {
      const businessProfile = businessProfileMap.get(user.id) ?? null;
      const product = productMap.get(user.id) ?? null;
      const mission = missionMap.get(user.id) ?? null;
      const items = mission ? missionItemsByMissionId.get(mission.id) ?? [] : [];
      const doneItemsCount = items.filter((item) => item.status === "done").length;
      const report = reportByUserId.get(user.id) ?? null;
      const payment = latestPaymentByUserId.get(user.id) ?? null;
      const readyToTest = Boolean(businessProfile && product && user.consent_given);
      const hasReportToday = Boolean(report);
      const needsFollowUp =
        user.status === "active" &&
        (!report || !user.telegram_chat_id || !mission);

      return {
        userId: user.id,
        name: user.full_name,
        whatsapp: user.whatsapp_number,
        cohort: user.cohort_name,
        telegramUsername: user.telegram_username,
        hasBusinessProfile: Boolean(businessProfile),
        hasProductFocus: Boolean(product),
        consentGiven: user.consent_given,
        telegramConnected: Boolean(user.telegram_chat_id),
        missionStatusLabel: mapMissionStatusLabel(mission),
        sentAt: mission?.sent_at ?? null,
        doneItemsCount,
        salesActionLabel: mapSalesActionLabel(doneItemsCount),
        hasReportToday,
        reportCode: report?.report_code ?? null,
        reportCodeLabel: mapReportCodeLabel(report?.report_code ?? null),
        paymentSignalLabel: mapPaymentSignalLabel(payment),
        readyToTest,
        needsFollowUp,
        followUpRecommendation: getFollowUpRecommendation({
          hasBusinessProfile: Boolean(businessProfile),
          hasProductFocus: Boolean(product),
          consentGiven: user.consent_given,
          telegramConnected: Boolean(user.telegram_chat_id),
          missionToday: mission,
          doneItemsCount,
          hasReportToday,
          reportCode: report?.report_code ?? null,
          payment,
        }),
      };
    })
    .filter((row) => matchesStatusFilter(row, filters.status));

  const totalTester = users.length;
  const siapDiuji = users.filter((user) => {
    return Boolean(
      businessProfileMap.get(user.id) &&
        productMap.get(user.id) &&
        user.consent_given
    );
  }).length;
  const telegramTerhubung = users.filter((user) => Boolean(user.telegram_chat_id)).length;
  const misiTerkirimHariIni = users.filter((user) => {
    const mission = missionMap.get(user.id);
    return mission ? ["sent", "reported"].includes(mission.mission_status) : false;
  }).length;
  const sudahBergerakHariIni = users.filter((user) => {
    const mission = missionMap.get(user.id);
    if (!mission) {
      return false;
    }

    const items = missionItemsByMissionId.get(mission.id) ?? [];
    return items.some((item) => item.status === "done");
  }).length;
  const sudahLaporHariIni = users.filter((user) => reportByUserId.has(user.id)).length;
  const perluFollowUp = users.filter((user) => {
    const mission = missionMap.get(user.id);
    const report = reportByUserId.get(user.id);
    return user.status === "active" && (!report || !user.telegram_chat_id || !mission);
  }).length;
  const adaSinyalBayar = users.filter((user) => {
    const payment = latestPaymentByUserId.get(user.id);
    return payment
      ? ["yes", "maybe"].includes(payment.verbal_intent ?? "") ||
          ["paid", "pending"].includes(payment.payment_action)
      : false;
  }).length;

  const funnel = [
    { label: "Data Tester Masuk", count: totalTester },
    { label: "Profil Bisnis Lengkap", count: usersWithBusinessProfileCount(users, businessProfileMap) },
    { label: "Produk Fokus Siap", count: usersWithProductFocusCount(users, productMap) },
    { label: "Telegram Terhubung", count: telegramTerhubung },
    { label: "Misi Dikirim", count: misiTerkirimHariIni },
    { label: "Aksi Jualan Selesai", count: sudahBergerakHariIni },
    { label: "Laporan Masuk", count: sudahLaporHariIni },
    { label: "Sinyal Bayar", count: adaSinyalBayar },
  ].map((step) => ({
    ...step,
    percentage: percentage(step.count, totalTester),
  }));

  const focusQueues = {
    onboardingStuck: testers
      .filter((tester) => !tester.readyToTest || !tester.telegramConnected)
      .slice(0, 5)
      .map((tester) => ({
        userId: tester.userId,
        name: tester.name,
        note: tester.followUpRecommendation,
      })),
    belumBergerak: testers
      .filter(
        (tester) =>
          ["Terkirim", "Sudah Dilaporkan"].includes(tester.missionStatusLabel) &&
          tester.doneItemsCount === 0
      )
      .slice(0, 5)
      .map((tester) => ({
        userId: tester.userId,
        name: tester.name,
        note: "Ingatkan mulai dari 1 misi ringan.",
      })),
    belumLapor: testers
      .filter(
        (tester) =>
          tester.doneItemsCount > 0 &&
          !tester.hasReportToday &&
          ["Terkirim", "Sudah Dilaporkan"].includes(tester.missionStatusLabel)
      )
      .slice(0, 5)
      .map((tester) => ({
        userId: tester.userId,
        name: tester.name,
        note: "Minta laporan singkat.",
      })),
    sinyalBayar: testers
      .filter((tester) =>
        ["Paid", "Pending", "Tertarik"].includes(tester.paymentSignalLabel)
      )
      .slice(0, 5)
      .map((tester) => ({
        userId: tester.userId,
        name: tester.name,
        note: tester.followUpRecommendation,
      })),
  };

  // Read but intentionally not surfaced directly to UI; keeps the page aligned with the
  // requested dogfooding data sources while preserving business-friendly wording.
  void missionEvaluations;
  void userActivityLogs;

  return {
    filters,
    summary: {
      totalTester,
      siapDiuji,
      telegramTerhubung,
      misiTerkirimHariIni,
      sudahBergerakHariIni,
      sudahLaporHariIni,
      perluFollowUp,
      adaSinyalBayar,
    },
    funnel,
    testers,
    focusQueues,
    warnings,
  };
}

function usersWithBusinessProfileCount(
  users: UserRow[],
  businessProfileMap: Map<string, BusinessProfileRow>
) {
  return users.filter((user) => businessProfileMap.has(user.id)).length;
}

function usersWithProductFocusCount(
  users: UserRow[],
  productMap: Map<string, ProductRow>
) {
  return users.filter((user) => productMap.has(user.id)).length;
}
