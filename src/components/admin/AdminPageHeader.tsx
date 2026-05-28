import Link from "next/link";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  currentPath: string;
  aside?: React.ReactNode;
};

const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/missions", label: "Missions" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminPageHeader({
  eyebrow = "OmzetPilot Admin",
  title,
  description,
  currentPath,
  aside,
}: AdminPageHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              {eyebrow}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          </div>

          {aside ? <div>{aside}</div> : null}
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex flex-wrap gap-2 border-t border-slate-200 pt-5"
        >
          {adminNavItems.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
