type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm leading-6 text-slate-800">{value}</div>
    </div>
  );
}
