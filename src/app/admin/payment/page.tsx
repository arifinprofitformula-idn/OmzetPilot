import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { PaymentValidationTable } from "@/src/components/admin/PaymentValidationTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { SystemHealthCard } from "@/src/components/admin/SystemHealthCard";
import { getAdminPaymentData } from "@/src/lib/adminPayment";

export const metadata: Metadata = {
  title: "Payment Validation | OmzetPilot",
  description: "Founder payment validation monitor for OmzetPilot.",
};

type AdminPaymentPageProps = {
  searchParams?: Promise<{
    action?: string;
    offer?: string;
    intent?: string;
    cohort?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s+/g, "");
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function buildInsights(
  summary: Awaited<ReturnType<typeof getAdminPaymentData>>["summary"]
) {
  if (summary.totalValidations === 0) {
    return ["No payment validation data yet."];
  }

  const insights: string[] = [];

  if (summary.paidUsers > 0) {
    insights.push(
      "Payment action confirmed. Early willingness to pay is validated."
    );
  }

  if (summary.pendingUsers > summary.paidUsers) {
    insights.push(
      "Many users are pending. Manual follow-up should be prioritized."
    );
  }

  if (summary.noUsers > 0) {
    insights.push(
      "Some users declined. Review reason_if_no to improve offer, timing, or value perception."
    );
  }

  if (summary.founderPlanInterest > summary.trialExtensionInterest) {
    insights.push(
      "Founder Plan has stronger interest than Trial Extension."
    );
  }

  if (summary.trialExtensionInterest > summary.founderPlanInterest) {
    insights.push(
      "Trial Extension may be easier as a low-friction continuation offer."
    );
  }

  if (insights.length === 0) {
    insights.push("Payment validation signals are still early but stable.");
  }

  return insights;
}

export default async function AdminPaymentPage({
  searchParams,
}: AdminPaymentPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminPaymentData({
    action: resolvedSearchParams?.action,
    offer: resolvedSearchParams?.offer,
    intent: resolvedSearchParams?.intent,
    cohort: resolvedSearchParams?.cohort,
  });
  const insights = buildInsights(data.summary);

  // TODO: Protect admin routes with authentication and authorization before public beta.
  return (
    <>
      <AdminPageHeader
        title="Payment Validation"
        subtitle="Monitor willingness to pay, founder plan signals, and payment action."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form
            className="grid gap-4 md:grid-cols-5 md:items-end"
            method="get"
            suppressHydrationWarning
          >
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Payment Action
              </span>
              <select
                name="action"
                defaultValue={data.filters.action}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="no">No</option>
                <option value="not_offered">Not Offered</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Offer Type</span>
              <select
                name="offer"
                defaultValue={data.filters.offer}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="founder_trial_extension">Trial Extension</option>
                <option value="founder_plan">Founder Plan</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Verbal Intent
              </span>
              <select
                name="intent"
                defaultValue={data.filters.intent}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Cohort</span>
              <input
                type="text"
                name="cohort"
                defaultValue={data.filters.cohort}
                placeholder="alpha_batch_1"
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              />
            </label>

            <button
              type="submit"
              suppressHydrationWarning
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
          </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total Validations"
            value={data.summary.totalValidations}
            description="Payment validation records matching the filter."
            tone="neutral"
          />
          <StatCard
            label="Paid Users"
            value={data.summary.paidUsers}
            description="Users who completed payment."
            tone="success"
          />
          <StatCard
            label="Pending Users"
            value={data.summary.pendingUsers}
            description="Users who still need follow-up."
            tone="warning"
          />
          <StatCard
            label="No Users"
            value={data.summary.noUsers}
            description="Users who declined the offer."
            tone="danger"
          />
          <StatCard
            label="Not Offered"
            value={data.summary.notOffered}
            description="Users who have not been offered continuation yet."
            tone="neutral"
          />
          <StatCard
            label="Total Amount Paid"
            value={formatCurrency(data.summary.totalAmountPaid)}
            description="Total paid amount captured in validation records."
            tone="success"
          />
          <StatCard
            label="Founder Plan Interest"
            value={data.summary.founderPlanInterest}
            description="Users showing interest in Founder Plan."
            tone="info"
          />
          <StatCard
            label="Trial Extension Interest"
            value={data.summary.trialExtensionInterest}
            description="Users showing interest in Trial Extension."
            tone="warning"
          />
          <StatCard
            label="Payment Conversion Rate"
            value={formatPercent(data.summary.paymentConversionRate)}
            description="Paid users divided by total validations."
            tone="info"
          />
      </section>

      <SystemHealthCard insights={insights} />

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No payment validation records found for the selected filter.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Try a broader action, offer, intent, or cohort filter.
            </p>
          </div>
        </section>
      ) : (
        <PaymentValidationTable rows={data.rows} />
      )}
    </>
  );
}
