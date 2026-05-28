import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { ReportsTable } from "@/src/components/admin/ReportsTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { getAdminReportsData } from "@/src/lib/adminReports";

export const metadata: Metadata = {
  title: "Reports & RGA | OmzetPilot",
  description: "Founder reporting monitor for OmzetPilot daily outcomes.",
};

type AdminReportsPageProps = {
  searchParams?: Promise<{
    date?: string;
    report_code?: string;
    closing?: string;
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

function formatAverage(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0";
}

function buildInsights(summary: Awaited<ReturnType<typeof getAdminReportsData>>["summary"]) {
  if (summary.totalReports === 0) {
    return ["No reports submitted for the selected filter."];
  }

  const insights: string[] = [];

  if (summary.reportCode4Count >= Math.max(2, summary.totalReports / 3)) {
    insights.push(
      "Several users did not execute missions. Consider lighter missions or reminder follow-up."
    );
  }

  if (summary.reportCode2Count >= Math.max(2, summary.totalReports / 3)) {
    insights.push(
      "Many users received responses but have not closed yet. Follow-up missions should be prioritized."
    );
  }

  if (summary.closingReports > 0) {
    insights.push(
      "Closing signal detected. Consider referral, repeat order, or closing push missions."
    );
  }

  if (insights.length === 0) {
    insights.push("Report flow looks stable for the selected filter.");
  }

  return insights;
}

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminReportsData({
    date: resolvedSearchParams?.date,
    report_code: resolvedSearchParams?.report_code,
    closing: resolvedSearchParams?.closing,
  });
  const insights = buildInsights(data.summary);

  // TODO: Protect admin routes with authentication and authorization before public beta.
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <AdminPageHeader
          currentPath="/admin/reports"
          title="Reports & RGA"
          description="Track daily report outcomes, revenue-generating actions, and closing signals."
          aside={
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Selected Date</p>
              <p>{data.filters.date}</p>
            </div>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form className="grid gap-4 md:grid-cols-4 md:items-end" method="get">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                type="date"
                name="date"
                defaultValue={data.filters.date}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Report Code</span>
              <select
                name="report_code"
                defaultValue={data.filters.reportCode}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Closing</span>
              <select
                name="closing"
                defaultValue={data.filters.closing}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
          </form>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total Reports"
            value={data.summary.totalReports}
            description="Reports matching the current filter."
            tone="neutral"
          />
          <StatCard
            label="Total RGA"
            value={data.summary.totalRga}
            description="Sum of RGA from filtered reports."
            tone="success"
          />
          <StatCard
            label="Average RGA per Report"
            value={formatAverage(data.summary.averageRgaPerReport)}
            description="Average RGA contribution per report."
            tone="info"
          />
          <StatCard
            label="Closing Reports"
            value={data.summary.closingReports}
            description="Reports marked with closing signals."
            tone="warning"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(data.summary.totalRevenue)}
            description="Revenue reported from selected outcomes."
            tone="success"
          />
          <StatCard
            label="Report Code 1 Count"
            value={data.summary.reportCode1Count}
            description="Closing / Money In outcomes."
            tone="success"
          />
          <StatCard
            label="Report Code 2 Count"
            value={data.summary.reportCode2Count}
            description="Response, not closing yet."
            tone="info"
          />
          <StatCard
            label="Report Code 3 Count"
            value={data.summary.reportCode3Count}
            description="Done, no response yet."
            tone="warning"
          />
          <StatCard
            label="Report Code 4 Count"
            value={data.summary.reportCode4Count}
            description="Mission not executed."
            tone="danger"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Insights
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Lightweight founder notes based on the current report mix.
              </p>
            </div>

            <div className="grid gap-3">
              {insights.map((insight) => (
                <div
                  key={insight}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </section>

        {data.rows.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
            <div className="mx-auto max-w-xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                No reports found for the selected filter.
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Try another date, closing filter, or report code selection.
              </p>
            </div>
          </section>
        ) : (
          <ReportsTable rows={data.rows} />
        )}
      </div>
    </main>
  );
}
