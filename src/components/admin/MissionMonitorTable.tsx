import Link from "next/link";

import { SendMissionButton } from "@/src/components/admin/SendMissionButton";
import { MissionStatusBadge } from "@/src/components/admin/MissionStatusBadge";
import { ReportCodeBadge } from "@/src/components/admin/ReportCodeBadge";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import type { MissionMonitorRow } from "@/src/lib/adminMissions";
import { getMissionItemStatusLabel } from "@/src/lib/uiLanguage";

type MissionMonitorTableProps = {
  rows: MissionMonitorRow[];
};

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value ?? 0)
    .replace(/\s+/g, "");
}

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

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function MissionMonitorTable({ rows }: MissionMonitorTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Tanggal</th>
              <th className="px-5 py-4">Tester</th>
              <th className="px-5 py-4">Telegram</th>
              <th className="px-5 py-4">Status Misi</th>
              <th className="px-5 py-4">Aksi Selesai</th>
              <th className="px-5 py-4">Aksi Jualan</th>
              <th className="px-5 py-4">Status Laporan</th>
              <th className="px-5 py-4">Hasil Laporan</th>
              <th className="px-5 py-4">Closing</th>
              <th className="px-5 py-4">Omzet</th>
              <th className="px-5 py-4">Waktu Kirim</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.mission.id} className="align-top">
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.mission.mission_date}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {row.user?.full_name ?? "Tester Tidak Dikenal"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.user?.whatsapp_number ?? row.mission.user_id}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={
                      row.telegramStatus === "connected"
                        ? "Terhubung"
                        : "Belum Terhubung"
                    }
                    tone={row.telegramStatus === "connected" ? "success" : "danger"}
                  />
                </td>
                <td className="px-5 py-4">
                  <MissionStatusBadge status={row.mission.mission_status} />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {row.doneItemsCount}/{row.missionItems.length}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {row.rga}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={
                      row.reportStatus === "reported" ? "Sudah Lapor" : "Belum Lapor"
                    }
                    tone={row.reportStatus === "reported" ? "success" : "warning"}
                  />
                </td>
                <td className="px-5 py-4">
                  <ReportCodeBadge reportCode={row.report?.report_code ?? null} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.report?.closing_status ? "Ya" : "Belum"}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(row.report?.revenue_amount ?? 0)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDateTime(row.mission.sent_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-52 flex-col gap-2">
                    <Link
                      href={`/admin/users/${row.mission.user_id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Lihat Tester
                    </Link>
                    <SendMissionButton userId={row.mission.user_id} />
                    {row.missionItems.length > 0 ? (
                      <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">
                          Lihat Aksi Jualan
                        </summary>
                        <div className="mt-3 space-y-3">
                          {row.missionItems.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                Aksi {item.mission_order}: {formatLabel(item.mission_type)}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {item.target_description}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                Status: {getMissionItemStatusLabel(item.status)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
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
