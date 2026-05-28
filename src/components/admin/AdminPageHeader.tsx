type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
};

export function AdminPageHeader({
  eyebrow = "OmzetPilot Admin",
  title,
  subtitle,
  actions,
}: AdminPageHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
              {subtitle}
            </p>
          </div>
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>
    </section>
  );
}
