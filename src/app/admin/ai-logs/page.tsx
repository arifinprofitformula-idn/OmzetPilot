import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { AiLogsTable } from "@/src/components/admin/AiLogsTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { SystemHealthCard } from "@/src/components/admin/SystemHealthCard";
import { getAdminAiLogsData } from "@/src/lib/adminAiLogs";

export const metadata: Metadata = {
  title: "AI Logs & System Health | OmzetPilot",
  description: "Founder AI monitoring page for OmzetPilot mission generation.",
};

type AdminAiLogsPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
    provider?: string;
    user_id?: string;
  }>;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function buildSystemHealthInsights(
  summary: Awaited<ReturnType<typeof getAdminAiLogsData>>["summary"]
) {
  if (summary.totalAiCalls === 0) {
    return ["No AI calls found for the selected filter."];
  }

  const insights: string[] = [];

  if (summary.failedCalls === 0 && summary.totalAiCalls > 0) {
    insights.push("AI engine is healthy for the selected filter.");
  } else if (summary.failureRate > 0 && summary.failureRate <= 5) {
    insights.push("Minor AI failures detected. Monitor error messages.");
  } else if (summary.failureRate > 5) {
    insights.push(
      "AI failure rate is above MVP target. Review fallback, timeout, and prompt output."
    );
  }

  if (summary.estimatedCostToday >= 1) {
    insights.push("Review generation frequency and daily cap.");
  }

  if (insights.length === 0) {
    insights.push("AI system looks stable for the selected filter.");
  }

  return insights;
}

export default async function AdminAiLogsPage({
  searchParams,
}: AdminAiLogsPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminAiLogsData({
    date: resolvedSearchParams?.date,
    status: resolvedSearchParams?.status,
    provider: resolvedSearchParams?.provider,
    user_id: resolvedSearchParams?.user_id,
  });
  const insights = buildSystemHealthInsights(data.summary);

  // TODO: Protect admin routes with authentication and authorization before public beta.
  return (
    <>
      <AdminPageHeader
        title="AI Logs & System Health"
        subtitle="Monitor mission generation, AI cost, fallback behavior, and failure patterns."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Selected Date</p>
            <p>{data.filters.date}</p>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form className="grid gap-4 md:grid-cols-5 md:items-end" method="get">
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
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue={data.filters.status}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Provider</span>
              <select
                name="provider"
                defaultValue={data.filters.provider}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="anthropic">Anthropic</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">User ID</span>
              <input
                type="text"
                name="user_id"
                defaultValue={data.filters.userId}
                placeholder="Optional UUID"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
          </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total AI Calls"
            value={data.summary.totalAiCalls}
            description="AI generation calls matching the current filter."
            tone="neutral"
          />
          <StatCard
            label="Success Calls"
            value={data.summary.successCalls}
            description="Calls that completed successfully."
            tone="success"
          />
          <StatCard
            label="Failed Calls"
            value={data.summary.failedCalls}
            description="Calls that ended in failure."
            tone="danger"
          />
          <StatCard
            label="AI Failure Rate"
            value={formatPercent(data.summary.failureRate)}
            description="Failed calls divided by total calls."
            tone="warning"
          />
          <StatCard
            label="Estimated Cost Today"
            value={formatUsd(data.summary.estimatedCostToday)}
            description="Estimated AI spend for the selected filter."
            tone="info"
          />
          <StatCard
            label="Average Estimated Cost per Call"
            value={formatUsd(data.summary.averageEstimatedCostPerCall)}
            description="Average estimated cost per AI call."
            tone="neutral"
          />
          <StatCard
            label="Total Input Tokens"
            value={data.summary.totalInputTokens}
            description="Estimated input token volume."
            tone="info"
          />
          <StatCard
            label="Total Output Tokens"
            value={data.summary.totalOutputTokens}
            description="Estimated output token volume."
            tone="success"
          />
      </section>

      <SystemHealthCard insights={insights} />

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No AI logs found for the selected filter.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Try another date, provider, status, or clear the user filter.
            </p>
          </div>
        </section>
      ) : (
        <AiLogsTable rows={data.rows} />
      )}
    </>
  );
}
