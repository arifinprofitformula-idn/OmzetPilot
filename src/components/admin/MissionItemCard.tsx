import { StatusBadge } from "@/src/components/admin/StatusBadge";
import type { Tables } from "@/src/types/database.types";

type MissionItemRow = Tables<"mission_items">;

type MissionItemCardProps = {
  item: MissionItemRow;
  formatDateTime: (value: string | null) => string;
  formatLabel: (value: string) => string;
  getStatusTone: (
    value: string | null | undefined
  ) => "neutral" | "success" | "info" | "warning" | "danger" | "muted";
};

function renderValue(value: string | null) {
  if (!value) {
    return "-";
  }

  return value;
}

export function MissionItemCard({
  item,
  formatDateTime,
  formatLabel,
  getStatusTone,
}: MissionItemCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Item {item.mission_order}: {formatLabel(item.mission_type)}
          </p>
          <p className="text-sm text-slate-600">
            Status:{" "}
            <StatusBadge
              label={formatLabel(item.status)}
              tone={getStatusTone(item.status)}
            />
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Completed: {formatDateTime(item.completed_at)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Target Description
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {renderValue(item.target_description)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Target Minimum
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {renderValue(item.target_minimum)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Action Instruction
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {renderValue(item.action_instruction)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Script Text
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {renderValue(item.script_text)}
          </p>
        </div>
      </div>
    </div>
  );
}
