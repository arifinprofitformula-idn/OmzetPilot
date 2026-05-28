import Link from "next/link";

import { GenerateMagicLinkButton } from "@/src/components/admin/GenerateMagicLinkButton";
import { SendMissionButton } from "@/src/components/admin/SendMissionButton";
import type { AdminUserRecord } from "@/src/lib/adminUsers";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import {
  getFitScoreLabel,
  getUserStatusLabel,
} from "@/src/lib/uiLanguage";

type UserTableProps = {
  users: AdminUserRecord[];
};

function formatCurrency(value: number) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

  return formatted.replace(/\s+/g, "");
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getUserStatusTone(status: string) {
  switch (status) {
    case "active":
      return "success";
    case "at_risk":
      return "warning";
    case "inactive":
      return "muted";
    case "dropped":
      return "danger";
    case "backup":
      return "info";
    default:
      return "neutral";
  }
}

function getFitScoreTone(fitScore: string | null) {
  switch (fitScore) {
    case "strong_fit":
      return "success";
    case "medium_fit":
      return "info";
    case "weak_fit":
      return "warning";
    case "reject":
      return "danger";
    default:
      return "muted";
  }
}

function getTelegramBadge(telegramStatus: AdminUserRecord["telegramStatus"]) {
  if (telegramStatus === "connected") {
    return <StatusBadge label="Terhubung" tone="success" />;
  }

  return <StatusBadge label="Belum Terhubung" tone="danger" />;
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Tester</th>
              <th className="px-5 py-4">WhatsApp</th>
              <th className="px-5 py-4">Telegram</th>
              <th className="px-5 py-4">Status Tester</th>
              <th className="px-5 py-4">Kecocokan</th>
              <th className="px-5 py-4">Batch</th>
              <th className="px-5 py-4">Total Aksi</th>
              <th className="px-5 py-4">Total Laporan</th>
              <th className="px-5 py-4">Total Omzet</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.id}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {user.whatsapp}
                </td>
                <td className="px-5 py-4">{getTelegramBadge(user.telegramStatus)}</td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={getUserStatusLabel(user.userStatus)}
                    tone={getUserStatusTone(user.userStatus)}
                  />
                </td>
                <td className="px-5 py-4">
                  {user.fitScore ? (
                    <StatusBadge
                      label={getFitScoreLabel(user.fitScore)}
                      tone={getFitScoreTone(user.fitScore)}
                    />
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">{user.cohort}</td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {user.totalRga}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {user.totalReports}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(user.totalRevenue)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-44 flex-col gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Lihat Detail
                    </Link>
                    <GenerateMagicLinkButton userId={user.id} />
                    <SendMissionButton userId={user.id} />
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
