import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { ReportsTable } from "@/src/components/admin/ReportsTable";
import { StatCard } from "@/src/components/admin/StatCard";
import { getAdminReportsData } from "@/src/lib/adminReports";

export const metadata: Metadata = {
  title: "Laporan Hasil & Aksi Jualan | OmzetPilot",
  description: "Pantauan hasil harian tester OmzetPilot.",
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
    return ["Belum ada laporan hasil pada filter ini."];
  }

  const insights: string[] = [];

  if (summary.reportCode4Count >= Math.max(2, summary.totalReports / 3)) {
    insights.push(
      "Beberapa tester belum menjalankan misi. Coba beri misi yang lebih ringan atau follow up singkat."
    );
  }

  if (summary.reportCode2Count >= Math.max(2, summary.totalReports / 3)) {
    insights.push(
      "Banyak tester sudah mendapat respon tapi belum closing. Prioritaskan misi follow up."
    );
  }

  if (summary.closingReports > 0) {
    insights.push(
      "Ada sinyal closing. Pertimbangkan dorongan repeat order, referral, atau closing push."
    );
  }

  if (insights.length === 0) {
    insights.push("Alur laporan terlihat stabil pada filter ini.");
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
    <>
      <AdminPageHeader
        title="Laporan Hasil & Aksi Jualan"
        subtitle="Baca hasil harian tester: aksi jualan, respon, closing, dan kendala."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Tanggal Dipilih</p>
            <p>{data.filters.date}</p>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form className="grid gap-4 md:grid-cols-4 md:items-end" method="get">
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
              <span className="text-sm font-medium text-slate-700">Hasil Laporan</span>
              <select
                name="report_code"
                defaultValue={data.filters.reportCode}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="1">1 • Ada Closing</option>
                <option value="2">2 • Ada Respon</option>
                <option value="3">3 • Sudah Aksi</option>
                <option value="4">4 • Belum Sempat</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Closing</span>
              <select
                name="closing"
                defaultValue={data.filters.closing}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="yes">Ya</option>
                <option value="no">Belum</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Terapkan
            </button>
          </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total Laporan"
            value={data.summary.totalReports}
            description="Jumlah laporan yang masuk ke filter ini."
            tone="neutral"
          />
          <StatCard
            label="Aksi Jualan"
            value={data.summary.totalRga}
            description="Total aksi jualan atau RGA dari laporan terpilih."
            tone="success"
          />
          <StatCard
            label="Rata-rata Aksi per Laporan"
            value={formatAverage(data.summary.averageRgaPerReport)}
            description="Rata-rata aksi jualan per laporan."
            tone="info"
          />
          <StatCard
            label="Ada Closing"
            value={data.summary.closingReports}
            description="Laporan dengan sinyal closing."
            tone="warning"
          />
          <StatCard
            label="Total Omzet"
            value={formatCurrency(data.summary.totalRevenue)}
            description="Omzet yang tercatat dari hasil terpilih."
            tone="success"
          />
          <StatCard
            label="Kode 1"
            value={data.summary.reportCode1Count}
            description="Ada closing atau uang masuk."
            tone="success"
          />
          <StatCard
            label="Kode 2"
            value={data.summary.reportCode2Count}
            description="Ada respon, belum closing."
            tone="info"
          />
          <StatCard
            label="Kode 3"
            value={data.summary.reportCode3Count}
            description="Sudah aksi, belum ada respon."
            tone="warning"
          />
          <StatCard
            label="Kode 4"
            value={data.summary.reportCode4Count}
            description="Belum sempat jalan."
            tone="danger"
          />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Insight Singkat
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Catatan cepat untuk membantu operator menentukan langkah berikutnya.
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
              Belum ada laporan hasil pada filter ini.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Pastikan tester sudah menerima misi dan mengirim laporan sore.
            </p>
          </div>
        </section>
      ) : (
        <ReportsTable rows={data.rows} />
      )}
    </>
  );
}
