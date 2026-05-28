import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { AiLogsTable } from "@/src/components/admin/AiLogsTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { SystemHealthCard } from "@/src/components/admin/SystemHealthCard";
import { getAdminAiLogsData } from "@/src/lib/adminAiLogs";

export const metadata: Metadata = {
  title: "Kesehatan Sistem | OmzetPilot",
  description: "Pantauan kesiapan sistem penyiapan misi OmzetPilot.",
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
    return ["Belum ada catatan sistem pada filter ini."];
  }

  const insights: string[] = [];

  if (summary.failedCalls === 0 && summary.totalAiCalls > 0) {
    insights.push("Sistem penyiapan misi terlihat sehat pada filter ini.");
  } else if (summary.failureRate > 0 && summary.failureRate <= 5) {
    insights.push("Ada kendala kecil pada sistem. Pantau catatan kendalanya.");
  } else if (summary.failureRate > 5) {
    insights.push(
      "Kendala sistem melewati target MVP. Periksa fallback, timeout, dan hasil arahan."
    );
  }

  if (summary.estimatedCostToday >= 1) {
    insights.push("Cek frekuensi penyiapan misi dan batas biaya harian.");
  }

  if (insights.length === 0) {
    insights.push("Sistem terlihat stabil pada filter ini.");
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
        title="Kesehatan Sistem"
        subtitle="Pantau apakah sistem berhasil menyiapkan misi dan tetap aman untuk digunakan."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Tanggal Dipilih</p>
            <p>{data.filters.date}</p>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form className="grid gap-4 md:grid-cols-5 md:items-end" method="get">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Tanggal</span>
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
                <option value="all">Semua</option>
                <option value="success">Berhasil</option>
                <option value="failed">Perlu Dicek</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Penyedia AI</span>
              <select
                name="provider"
                defaultValue={data.filters.provider}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="anthropic">Anthropic</option>
                <option value="other">Lainnya</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">ID Tester</span>
              <input
                type="text"
                name="user_id"
                defaultValue={data.filters.userId}
                placeholder="Opsional"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Terapkan
            </button>
          </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Catatan Sistem"
            value={data.summary.totalAiCalls}
            description="Jumlah catatan sistem pada filter ini."
            tone="neutral"
          />
          <StatCard
            label="Berhasil"
            value={data.summary.successCalls}
            description="Proses penyiapan misi yang selesai dengan baik."
            tone="success"
          />
          <StatCard
            label="Perlu Dicek"
            value={data.summary.failedCalls}
            description="Proses yang berakhir dengan kendala."
            tone="danger"
          />
          <StatCard
            label="Tingkat Kendala"
            value={formatPercent(data.summary.failureRate)}
            description="Persentase kendala dibanding total catatan sistem."
            tone="warning"
          />
          <StatCard
            label="Estimasi Biaya Hari Ini"
            value={formatUsd(data.summary.estimatedCostToday)}
            description="Perkiraan biaya sistem pada filter ini."
            tone="info"
          />
          <StatCard
            label="Biaya Rata-rata per Proses"
            value={formatUsd(data.summary.averageEstimatedCostPerCall)}
            description="Rata-rata estimasi biaya setiap proses."
            tone="neutral"
          />
          <StatCard
            label="Total Input"
            value={data.summary.totalInputTokens}
            description="Estimasi pemakaian input."
            tone="info"
          />
          <StatCard
            label="Total Output"
            value={data.summary.totalOutputTokens}
            description="Estimasi pemakaian output."
            tone="success"
          />
      </section>

      <SystemHealthCard
        insights={insights}
        title="Kesehatan Sistem"
        subtitle="Ringkasan singkat untuk melihat apakah penyiapan misi berjalan sehat dan terkendali."
      />

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Belum ada catatan pembuatan misi.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Catatan akan muncul setelah sistem menyiapkan misi.
            </p>
          </div>
        </section>
      ) : (
        <AiLogsTable rows={data.rows} />
      )}
    </>
  );
}
