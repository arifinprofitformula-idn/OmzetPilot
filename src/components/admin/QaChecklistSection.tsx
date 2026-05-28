import { QaStatusBadge } from "@/src/components/admin/QaStatusBadge";
import type { QaChecklistSection as QaChecklistSectionType } from "@/src/lib/adminQa";

type QaChecklistSectionProps = {
  section: QaChecklistSectionType;
};

export function QaChecklistSection({ section }: QaChecklistSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          {section.title}
        </h2>

        <div className="space-y-3">
          {section.items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </div>
                <QaStatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
