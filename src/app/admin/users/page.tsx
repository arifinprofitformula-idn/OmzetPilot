import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { StatCard } from "@/src/components/admin/StatCard";
import { UserTable } from "@/src/components/admin/UserTable";
import { getAdminUsersPageData } from "@/src/lib/adminUsers";

export const metadata: Metadata = {
  title: "Kelola Tester | OmzetPilot",
  description:
    "Founder view for monitoring users, Telegram connectivity, and alpha cohort progress.",
};

export default async function AdminUsersPage() {
  await connection();

  // TODO: Protect admin routes with authentication and authorization before public beta.
  const { users, summary } = await getAdminUsersPageData();

  return (
    <>
      <AdminPageHeader
        title="Kelola Tester"
        subtitle="Pantau kesiapan data, koneksi Telegram, dan progress aksi jualan setiap tester."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tester"
          value={summary.totalUsers}
          description="Semua tester yang sudah terdaftar."
          tone="neutral"
        />
        <StatCard
          label="Telegram Terhubung"
          value={summary.telegramConnected}
          description="Tester yang sudah tersambung ke Telegram."
          tone="info"
        />
        <StatCard
          label="Tester Aktif"
          value={summary.activeUsers}
          description="Tester yang masih aktif berjalan."
          tone="success"
        />
        <StatCard
          label="Perlu Dibantu"
          value={summary.needsAttention}
          description="Tester yang perlu dibantu atau belum bergerak."
          tone="warning"
        />
      </section>

      {users.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Belum ada tester
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Tambahkan tester dulu agar OmzetPilot bisa mulai diuji.
            </p>
          </div>
        </section>
      ) : (
        <UserTable users={users} />
      )}
    </>
  );
}
