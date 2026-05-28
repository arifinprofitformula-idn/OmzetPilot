import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { PaymentValidationTable } from "@/src/components/admin/PaymentValidationTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { SystemHealthCard } from "@/src/components/admin/SystemHealthCard";
import { getAdminPaymentData } from "@/src/lib/adminPayment";

export const metadata: Metadata = {
  title: "Sinyal Bayar | OmzetPilot",
  description: "Pantauan minat lanjut dan pembayaran tester OmzetPilot.",
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
    return ["Belum ada sinyal bayar. Data akan muncul setelah offer hari ke-7 atau follow up manual."];
  }

  const insights: string[] = [];

  if (summary.paidUsers > 0) {
    insights.push(
      "Sudah ada aksi bayar. Ini tanda awal bahwa willingness to pay mulai terbukti."
    );
  }

  if (summary.pendingUsers > summary.paidUsers) {
    insights.push(
      "Banyak tester masih menunggu bayar. Prioritaskan follow up manual."
    );
  }

  if (summary.noUsers > 0) {
    insights.push(
      "Ada tester yang tidak lanjut. Baca alasannya untuk memperbaiki offer, timing, atau persepsi nilai."
    );
  }

  if (summary.founderPlanInterest > summary.trialExtensionInterest) {
    insights.push(
      "Founder Plan terlihat lebih menarik dibanding lanjut uji coba."
    );
  }

  if (summary.trialExtensionInterest > summary.founderPlanInterest) {
    insights.push(
      "Lanjut uji coba mungkin lebih mudah ditawarkan sebagai langkah lanjutan yang ringan."
    );
  }

  if (insights.length === 0) {
    insights.push("Sinyal bayar masih awal, tapi arahnya cukup stabil.");
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
        title="Sinyal Bayar"
        subtitle="Pantau tester yang tertarik lanjut, menunggu pembayaran, atau belum siap melanjutkan."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form
            className="grid gap-4 md:grid-cols-5 md:items-end"
            method="get"
            suppressHydrationWarning
          >
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Status Bayar
              </span>
              <select
                name="action"
                defaultValue={data.filters.action}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="paid">Sudah Bayar</option>
                <option value="pending">Menunggu Bayar</option>
                <option value="no">Tidak Lanjut</option>
                <option value="not_offered">Belum Ditawarkan</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Penawaran</span>
              <select
                name="offer"
                defaultValue={data.filters.offer}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="founder_trial_extension">Lanjut Uji Coba</option>
                <option value="founder_plan">Founder Plan</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Minat Verbal
              </span>
              <select
                name="intent"
                defaultValue={data.filters.intent}
                suppressHydrationWarning
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="yes">Tertarik</option>
                <option value="maybe">Masih Pertimbangkan</option>
                <option value="no">Belum Berminat</option>
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
              Terapkan
            </button>
          </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total Sinyal Bayar"
            value={data.summary.totalValidations}
            description="Jumlah catatan sinyal bayar pada filter ini."
            tone="neutral"
          />
          <StatCard
            label="Sudah Bayar"
            value={data.summary.paidUsers}
            description="Tester yang sudah menyelesaikan pembayaran."
            tone="success"
          />
          <StatCard
            label="Menunggu Bayar"
            value={data.summary.pendingUsers}
            description="Tester yang masih perlu follow up."
            tone="warning"
          />
          <StatCard
            label="Tidak Lanjut"
            value={data.summary.noUsers}
            description="Tester yang memutuskan tidak lanjut."
            tone="danger"
          />
          <StatCard
            label="Belum Ditawarkan"
            value={data.summary.notOffered}
            description="Tester yang belum mendapat penawaran lanjutan."
            tone="neutral"
          />
          <StatCard
            label="Total Nominal Masuk"
            value={formatCurrency(data.summary.totalAmountPaid)}
            description="Total nominal yang sudah tercatat sebagai pembayaran."
            tone="success"
          />
          <StatCard
            label="Minat Founder Plan"
            value={data.summary.founderPlanInterest}
            description="Tester yang menunjukkan minat ke Founder Plan."
            tone="info"
          />
          <StatCard
            label="Minat Lanjut Uji Coba"
            value={data.summary.trialExtensionInterest}
            description="Tester yang tertarik lanjut masa uji coba."
            tone="warning"
          />
          <StatCard
            label="Tingkat Bayar"
            value={formatPercent(data.summary.paymentConversionRate)}
            description="Persentase tester yang sudah bayar dari seluruh catatan."
            tone="info"
          />
      </section>

      <SystemHealthCard
        insights={insights}
        title="Insight Sinyal Bayar"
        subtitle="Catatan cepat untuk membantu founder/operator menentukan follow up berikutnya."
      />

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Belum ada sinyal bayar.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Data akan muncul setelah offer hari ke-7 atau follow up manual.
            </p>
          </div>
        </section>
      ) : (
        <PaymentValidationTable rows={data.rows} />
      )}
    </>
  );
}
