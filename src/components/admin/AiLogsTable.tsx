import Link from "next/link";

import { AiLogStatusBadge } from "@/src/components/admin/AiLogStatusBadge";
import type { AdminAiLogRow } from "@/src/lib/adminAiLogs";

type AiLogsTableProps = {
  rows: AdminAiLogRow[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatUsd(value: number | null) {
  const amount = value ?? 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount > 0 && amount < 0.01 ? 6 : 2,
    maximumFractionDigits: amount > 0 && amount < 0.01 ? 6 : 2,
  }).format(amount);
}

function truncateError(value: string | null) {
  if (!value) {
    return "-";
  }

  if (value.length <= 120) {
    return value;
  }

  return `${value.slice(0, 117)}...`;
}

export function AiLogsTable({ rows }: AiLogsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Waktu</th>
              <th className="px-5 py-4">Tester</th>
              <th className="px-5 py-4">Misi</th>
              <th className="px-5 py-4">Versi Arahan</th>
              <th className="px-5 py-4">Penyedia AI</th>
              <th className="px-5 py-4">Model</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Input</th>
              <th className="px-5 py-4">Output</th>
              <th className="px-5 py-4">Estimasi Biaya</th>
              <th className="px-5 py-4">Catatan Kendala</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.aiLog.id} className="align-top">
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDateTime(row.aiLog.created_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {row.user?.full_name ?? "Tester Tidak Dikenal"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.user?.whatsapp_number ?? row.aiLog.user_id}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  <span className="break-all">
                    {row.aiLog.mission_id ?? "-"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.aiLog.prompt_version}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.aiLog.model_provider}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.aiLog.model_name}
                </td>
                <td className="px-5 py-4">
                  <AiLogStatusBadge status={row.aiLog.status} />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {row.aiLog.token_input_estimate ?? 0}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {row.aiLog.token_output_estimate ?? 0}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatUsd(row.aiLog.estimated_cost)}
                </td>
                <td
                  className="px-5 py-4 text-sm text-slate-700"
                  title={row.aiLog.error_message ?? undefined}
                >
                  {truncateError(row.aiLog.error_message)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-44 flex-col gap-2">
                    <Link
                      href={`/admin/users/${row.aiLog.user_id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Lihat Tester
                    </Link>
                    {row.aiLog.mission_id ? (
                      <Link
                        href={
                          row.mission?.mission_date
                            ? `/admin/missions?date=${row.mission.mission_date}`
                            : "/admin/missions"
                        }
                        className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50"
                      >
                        Lihat Misi
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
                        Belum Ada Tautan
                      </span>
                    )}
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
