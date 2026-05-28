import type { ReactNode } from "react";

import { AdminSidebar } from "@/src/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100/70">
      {/* TODO: Protect admin routes with real authentication before public beta. */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
