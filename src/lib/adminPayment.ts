import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { Tables } from "@/src/types/database.types";

type PaymentValidationRow = Tables<"payment_validations">;
type UserRow = Tables<"users">;

export type PaymentActionFilter =
  | "all"
  | "paid"
  | "pending"
  | "no"
  | "not_offered";
export type PaymentOfferFilter =
  | "all"
  | "founder_trial_extension"
  | "founder_plan";
export type PaymentIntentFilter = "all" | "yes" | "maybe" | "no";

export type AdminPaymentFilters = {
  action: PaymentActionFilter;
  offer: PaymentOfferFilter;
  intent: PaymentIntentFilter;
  cohort: string;
};

export type AdminPaymentRow = {
  paymentValidation: PaymentValidationRow;
  user: UserRow | null;
  cohort: string | null;
};

export type AdminPaymentData = {
  filters: AdminPaymentFilters;
  rows: AdminPaymentRow[];
  summary: {
    totalValidations: number;
    paidUsers: number;
    pendingUsers: number;
    noUsers: number;
    notOffered: number;
    totalAmountPaid: number;
    founderPlanInterest: number;
    trialExtensionInterest: number;
    paymentConversionRate: number;
  };
};

const ACTION_FILTERS = new Set<PaymentActionFilter>([
  "all",
  "paid",
  "pending",
  "no",
  "not_offered",
]);
const OFFER_FILTERS = new Set<PaymentOfferFilter>([
  "all",
  "founder_trial_extension",
  "founder_plan",
]);
const INTENT_FILTERS = new Set<PaymentIntentFilter>(["all", "yes", "maybe", "no"]);

function normalizeFilters(input: {
  action?: string;
  offer?: string;
  intent?: string;
  cohort?: string;
}): AdminPaymentFilters {
  const action: PaymentActionFilter = ACTION_FILTERS.has(
    input.action as PaymentActionFilter
  )
    ? (input.action as PaymentActionFilter)
    : "all";
  const offer: PaymentOfferFilter = OFFER_FILTERS.has(
    input.offer as PaymentOfferFilter
  )
    ? (input.offer as PaymentOfferFilter)
    : "all";
  const intent: PaymentIntentFilter = INTENT_FILTERS.has(
    input.intent as PaymentIntentFilter
  )
    ? (input.intent as PaymentIntentFilter)
    : "all";

  return {
    action,
    offer,
    intent,
    cohort: input.cohort?.trim() ?? "",
  };
}

function hasInterest(row: AdminPaymentRow, offerType: PaymentOfferFilter) {
  const payment = row.paymentValidation;

  if (payment.offer_type !== offerType) {
    return false;
  }

  return (
    payment.verbal_intent === "yes" ||
    payment.verbal_intent === "maybe" ||
    payment.payment_action === "paid" ||
    payment.payment_action === "pending"
  );
}

export async function getAdminPaymentData(input: {
  action?: string;
  offer?: string;
  intent?: string;
  cohort?: string;
}): Promise<AdminPaymentData> {
  const filters = normalizeFilters(input);

  let paymentQuery = supabaseAdmin
    .from("payment_validations")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.action !== "all") {
    paymentQuery = paymentQuery.eq("payment_action", filters.action);
  }

  if (filters.offer !== "all") {
    paymentQuery = paymentQuery.eq("offer_type", filters.offer);
  }

  if (filters.intent !== "all") {
    paymentQuery = paymentQuery.eq("verbal_intent", filters.intent);
  }

  if (filters.cohort) {
    paymentQuery = paymentQuery.ilike("cohort_name", filters.cohort);
  }

  const { data: paymentValidations, error: paymentError } = await paymentQuery;

  if (paymentError) {
    throw new Error(
      `Failed to load payment validations: ${paymentError.message}`
    );
  }

  const paymentRows = paymentValidations ?? [];
  const userIds = Array.from(new Set(paymentRows.map((row) => row.user_id)));

  let users: UserRow[] = [];

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

  const userMap = new Map(users.map((user) => [user.id, user]));

  let rows: AdminPaymentRow[] = paymentRows.map((paymentValidation) => {
    const user = userMap.get(paymentValidation.user_id) ?? null;

    return {
      paymentValidation,
      user,
      cohort: paymentValidation.cohort_name ?? user?.cohort_name ?? null,
    };
  });

  if (filters.cohort) {
    const target = filters.cohort.toLowerCase();
    rows = rows.filter((row) => (row.cohort ?? "").toLowerCase().includes(target));
  }

  const totalValidations = rows.length;
  const paidUsers = rows.filter(
    (row) => row.paymentValidation.payment_action === "paid"
  ).length;
  const pendingUsers = rows.filter(
    (row) => row.paymentValidation.payment_action === "pending"
  ).length;
  const noUsers = rows.filter(
    (row) => row.paymentValidation.payment_action === "no"
  ).length;
  const notOffered = rows.filter(
    (row) => row.paymentValidation.payment_action === "not_offered"
  ).length;
  const totalAmountPaid = rows.reduce((sum, row) => {
    if (row.paymentValidation.payment_action !== "paid") {
      return sum;
    }

    return sum + (row.paymentValidation.amount_paid ?? 0);
  }, 0);
  const founderPlanInterest = rows.filter((row) =>
    hasInterest(row, "founder_plan")
  ).length;
  const trialExtensionInterest = rows.filter((row) =>
    hasInterest(row, "founder_trial_extension")
  ).length;

  return {
    filters,
    rows,
    summary: {
      totalValidations,
      paidUsers,
      pendingUsers,
      noUsers,
      notOffered,
      totalAmountPaid,
      founderPlanInterest,
      trialExtensionInterest,
      paymentConversionRate:
        totalValidations > 0 ? (paidUsers / totalValidations) * 100 : 0,
    },
  };
}
