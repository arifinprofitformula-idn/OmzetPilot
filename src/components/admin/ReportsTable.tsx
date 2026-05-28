import Link from "next/link";

import { ReportCodeBadge } from "@/src/components/admin/ReportCodeBadge";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import type { AdminReportRow } from "@/src/lib/adminReports";

type ReportsTableProps = {
  rows: AdminReportRow[];
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value ?? 0)
    .replace(/\s+/g, "");
}

export function ReportsTable({ rows }: ReportsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Reported At</th>
              <th className="px-5 py-4">Mission Date</th>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Report Code</th>
              <th className="px-5 py-4">RGA Count</th>
              <th className="px-5 py-4">Chats Sent</th>
              <th className="px-5 py-4">Responses</th>
              <th className="px-5 py-4">Closing</th>
              <th className="px-5 py-4">Revenue</th>
              <th className="px-5 py-4">Obstacle</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.report.id} className="align-top">
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDateTime(row.report.reported_at)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.mission?.mission_date ?? "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {row.user?.full_name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.user?.whatsapp_number ?? row.report.user_id}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ReportCodeBadge reportCode={row.report.report_code} />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {row.report.rga_count}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.report.chats_sent ?? "-"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.report.responses_count ?? "-"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={row.report.closing_status ? "Yes" : "No"}
                    tone={row.report.closing_status ? "success" : "muted"}
                  />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(row.report.revenue_amount)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.report.obstacle || "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-44 flex-col gap-2">
                    <Link
                      href={`/admin/users/${row.report.user_id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      View User Detail
                    </Link>
                    <Link
                      href={`/admin/missions?date=${row.mission?.mission_date ?? ""}`}
                      className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50"
                    >
                      View Mission Monitor
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
