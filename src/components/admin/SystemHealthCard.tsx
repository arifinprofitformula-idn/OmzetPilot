type SystemHealthCardProps = {
  insights: string[];
};

export function SystemHealthCard({ insights }: SystemHealthCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            System Health
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Lightweight AI reliability notes for the selected filter.
          </p>
        </div>

        <div className="grid gap-3">
          {insights.map((insight) => (
            <div
              key={insight}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700"
            >
              {insight}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
