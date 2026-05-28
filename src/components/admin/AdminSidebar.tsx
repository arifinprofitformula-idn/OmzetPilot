"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/missions", label: "Missions" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/ai-logs", label: "AI Logs" },
  { href: "/admin/payment", label: "Payment" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/qa", label: "QA" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="sticky top-0 flex min-h-screen flex-col px-6 py-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xl font-semibold tracking-tight text-slate-950">
              OmzetPilot
            </p>
            <p className="mt-1 text-sm text-slate-600">Daily Mission Engine</p>
            <span className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              Internal MVP
            </span>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2" aria-label="Admin">
            {adminNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Internal MVP • Founder Console
          </div>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                OmzetPilot
              </p>
              <p className="text-sm text-slate-600">Daily Mission Engine</p>
            </div>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
              Internal MVP
            </span>
          </div>

          <nav
            aria-label="Admin mobile"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {adminNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
