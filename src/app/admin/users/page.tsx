import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { StatCard } from "@/src/components/admin/StatCard";
import { UserTable } from "@/src/components/admin/UserTable";
import { getAdminUsersPageData } from "@/src/lib/adminUsers";

export const metadata: Metadata = {
  title: "Users Management | OmzetPilot",
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
        title="Users Management"
        subtitle="Monitor alpha testers, Telegram connection, and sales activity progress."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={summary.totalUsers}
          description="All users currently stored in the system."
          tone="neutral"
        />
        <StatCard
          label="Telegram Connected"
          value={summary.telegramConnected}
          description="Users with a linked Telegram chat ID."
          tone="info"
        />
        <StatCard
          label="Active Users"
          value={summary.activeUsers}
          description="Users currently marked as active."
          tone="success"
        />
        <StatCard
          label="Needs Attention"
          value={summary.needsAttention}
          description="Users currently marked at risk or inactive."
          tone="warning"
        />
      </section>

      {users.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No users found yet
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              The admin table will appear here once alpha testers are stored in
              Supabase.
            </p>
          </div>
        </section>
      ) : (
        <UserTable users={users} />
      )}
    </>
  );
}
