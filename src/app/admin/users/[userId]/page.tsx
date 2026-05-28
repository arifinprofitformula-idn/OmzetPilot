import Link from "next/link";
import type { Metadata } from "next";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "User Detail | OmzetPilot",
  description: "Placeholder admin user detail page for OmzetPilot.",
};

export default async function AdminUserDetailPage(
  props: PageProps<"/admin/users/[userId]">
) {
  const { userId } = await props.params;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 lg:px-8">
        <AdminPageHeader
          currentPath="/admin/users"
          title="User Detail"
          description="This detail view is a lightweight placeholder for the next admin step."
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-500">Selected User ID</p>
            <p className="break-all text-lg font-semibold text-slate-950">
              {userId}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Detailed user inspection is not part of this step yet, but the
              route is in place so the users table has a working destination.
            </p>
            <Link
              href="/admin/users"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Users
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
