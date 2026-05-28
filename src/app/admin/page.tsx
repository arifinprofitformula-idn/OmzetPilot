import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { StatCard } from "@/src/components/admin/StatCard";
import { getDashboardStats } from "@/src/lib/dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | OmzetPilot",
  description: "Founder dashboard for OmzetPilot daily mission operations.",
};

export default async function AdminDashboardPage() {
  await connection();

  // TODO: Protect admin routes with authentication and authorization before public beta.
  const stats = await getDashboardStats();

  return (
    <>
      <AdminPageHeader
        title="Daily Mission Engine Dashboard"
        subtitle="Founder overview of user activity, mission delivery, and reporting performance for today in WIB."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Today (WIB)</p>
            <p>{stats.todayWib}</p>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          description="All users currently stored in Supabase."
          tone="neutral"
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers}
          description="Users with active status in the core user table."
          tone="success"
        />
        <StatCard
          label="Telegram Connected Users"
          value={stats.telegramConnectedUsers}
          description="Users with a linked Telegram chat ready for delivery."
          tone="info"
        />
        <StatCard
          label="Missions Sent Today"
          value={stats.missionsSentToday}
          description="Today's missions that have already been sent."
          tone="info"
        />
        <StatCard
          label="RGA Today"
          value={stats.rgaToday}
          description="Total reported RGA completed by users today."
          tone="success"
        />
        <StatCard
          label="Reports Today"
          value={stats.reportsToday}
          description="Mission reports received during today's WIB window."
          tone="neutral"
        />
        <StatCard
          label="Closing Reports Today"
          value={stats.closingReportsToday}
          description="Reports marked as closing outcomes today."
          tone="warning"
        />
        <StatCard
          label="At Risk Users"
          value={stats.atRiskUsers}
          description="Active Telegram users who have not reported yet today."
          tone="danger"
        />
      </section>
    </>
  );
}
