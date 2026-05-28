import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { StatCard } from "@/src/components/admin/StatCard";
import { getDashboardStats } from "@/src/lib/dashboard";

export const metadata: Metadata = {
  title: "Ruang Kendali OmzetPilot | OmzetPilot",
  description: "Pantauan utama tester, misi jualan, dan laporan hasil OmzetPilot.",
};

export default async function AdminDashboardPage() {
  await connection();

  // TODO: Protect admin routes with authentication and authorization before public beta.
  const stats = await getDashboardStats();

  return (
    <>
      <AdminPageHeader
        title="Ruang Kendali OmzetPilot"
        subtitle="Pantau tester, misi jualan, laporan hasil, dan sinyal bayar dalam satu tempat."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Hari Ini (WIB)</p>
            <p>{stats.todayWib}</p>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tester"
          value={stats.totalUsers}
          description="Semua tester yang sudah masuk ke sistem."
          tone="neutral"
        />
        <StatCard
          label="Tester Aktif"
          value={stats.activeUsers}
          description="Tester yang masih aktif mengikuti alur harian."
          tone="success"
        />
        <StatCard
          label="Telegram Terhubung"
          value={stats.telegramConnectedUsers}
          description="Tester yang sudah siap menerima misi lewat Telegram."
          tone="info"
        />
        <StatCard
          label="Misi Terkirim Hari Ini"
          value={stats.missionsSentToday}
          description="Jumlah misi hari ini yang sudah dikirim."
          tone="info"
        />
        <StatCard
          label="Aksi Jualan Hari Ini"
          value={stats.rgaToday}
          description="Total aksi jualan atau RGA yang sudah dilaporkan hari ini."
          tone="success"
        />
        <StatCard
          label="Laporan Masuk Hari Ini"
          value={stats.reportsToday}
          description="Laporan hasil yang masuk pada hari ini."
          tone="neutral"
        />
        <StatCard
          label="Closing Hari Ini"
          value={stats.closingReportsToday}
          description="Laporan yang sudah menunjukkan closing atau uang masuk."
          tone="warning"
        />
        <StatCard
          label="Perlu Dibantu"
          value={stats.atRiskUsers}
          description="Tester aktif yang belum lapor atau masih perlu dorongan."
          tone="danger"
        />
      </section>
    </>
  );
}
