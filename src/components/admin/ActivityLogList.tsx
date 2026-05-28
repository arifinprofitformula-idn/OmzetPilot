import type { Tables } from "@/src/types/database.types";

type UserActivityLogRow = Tables<"user_activity_logs">;

type ActivityLogListProps = {
  logs: UserActivityLogRow[];
  formatDateTime: (value: string | null) => string;
  summarizeMetadata: (value: UserActivityLogRow["metadata"]) => string;
};

export function ActivityLogList({
  logs,
  formatDateTime,
  summarizeMetadata,
}: ActivityLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
        No activity logs available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {log.activity_type}
              </p>
              <p className="text-sm text-slate-600">Channel: {log.channel}</p>
            </div>
            <p className="text-sm text-slate-500">
              {formatDateTime(log.created_at)}
            </p>
          </div>

          <p className="mt-3 text-sm leading-6 break-words text-slate-700">
            {summarizeMetadata(log.metadata)}
          </p>
        </div>
      ))}
    </div>
  );
}
