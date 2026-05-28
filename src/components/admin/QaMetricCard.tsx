type QaMetricCardProps = {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneStyles: Record<NonNullable<QaMetricCardProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-white text-slate-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

export function QaMetricCard({
  label,
  value,
  tone = "neutral",
}: QaMetricCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneStyles[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
