type QaRunbookCardProps = {
  steps: string[];
};

export function QaRunbookCard({ steps }: QaRunbookCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Manual QA Runbook
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Follow this sequence to validate the core OmzetPilot loop end to
            end.
          </p>
        </div>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-700">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
