type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  tone?: "neutral" | "success" | "info" | "warning" | "danger";
};

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-white text-slate-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
};

export function StatCard({
  label,
  value,
  description,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="h-3 w-3 rounded-full bg-current/70" aria-hidden />
      </div>

      <p className="mt-4 text-sm text-slate-600">{description}</p>
    </div>
  );
}
