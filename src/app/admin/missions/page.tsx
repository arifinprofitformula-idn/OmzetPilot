import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { MissionMonitorTable } from "@/src/components/admin/MissionMonitorTable";
import { SendEveningReportButton } from "@/src/components/admin/SendEveningReportButton";
import { StatCard } from "@/src/components/admin/StatCard";
import { getAdminMissionsData } from "@/src/lib/adminMissions";

export const metadata: Metadata = {
  title: "Pantauan Misi Jualan | OmzetPilot",
  description: "Pantauan misi jualan harian untuk tester OmzetPilot.",
};

type AdminMissionsPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
    report?: string;
  }>;
};

export default async function AdminMissionsPage({
  searchParams,
}: AdminMissionsPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminMissionsData({
    date: resolvedSearchParams?.date,
    status: resolvedSearchParams?.status,
    report: resolvedSearchParams?.report,
  });

  // TODO: Protect admin routes with authentication and authorization before public beta.
  return (
    <>
      <AdminPageHeader
        title="Pantauan Misi Jualan"
        subtitle="Lihat siapa yang sudah menerima misi, menjalankan aksi, dan perlu diingatkan."
        actions={
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Tanggal Dipilih</p>
              <p>{data.filters.date}</p>
            </div>
            <div className="w-full md:w-80">
              <SendEveningReportButton />
            </div>
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
              <span className="text-sm font-medium text-slate-700">
                Status Misi
              </span>
              <select
                name="status"
                defaultValue={data.filters.status}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="drafted">Belum Dikirim</option>
                <option value="sent">Misi Terkirim</option>
                <option value="reported">Sudah Lapor</option>
                <option value="missed">Terlewat</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Status Laporan
              </span>
              <select
                name="report"
                defaultValue={data.filters.report}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">Semua</option>
                <option value="reported">Sudah Lapor</option>
                <option value="not_reported">Belum Lapor</option>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total Misi"
          value={data.summary.totalMissions}
          description="Jumlah misi yang masuk ke filter ini."
          tone="neutral"
        />
          <StatCard
            label="Misi Terkirim"
            value={data.summary.sentMissions}
            description="Misi yang sudah sampai ke tester."
            tone="info"
          />
          <StatCard
            label="Sudah Lapor"
            value={data.summary.reportedMissions}
            description="Misi yang sudah punya laporan hasil."
            tone="success"
          />
          <StatCard
            label="Aksi Jualan"
            value={data.summary.totalRga}
            description="Aksi jualan atau RGA yang sudah tercatat."
            tone="success"
          />
          <StatCard
            label="Ada Closing"
            value={data.summary.closingReports}
            description="Laporan dengan tanda closing."
            tone="warning"
          />
          <StatCard
            label="Belum Lapor"
            value={data.summary.needsReport}
            description="Misi yang masih menunggu laporan hasil."
            tone="danger"
          />
      </section>

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Belum ada misi pada filter ini.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Jika tester sudah siap, kirim misi dari halaman Tester.
            </p>
          </div>
        </section>
      ) : (
        <MissionMonitorTable rows={data.rows} />
      )}
    </>
  );
}
