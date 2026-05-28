import type { Metadata } from "next";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Reports | OmzetPilot",
  description: "Placeholder reports page for OmzetPilot admin.",
};

export default function AdminReportsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 lg:px-8">
        <AdminPageHeader
          currentPath="/admin/reports"
          title="Reports"
          description="Reports management UI will land in a later step. This placeholder keeps admin navigation consistent for now."
        />
      </div>
    </main>
  );
}
