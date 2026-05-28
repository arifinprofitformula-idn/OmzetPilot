import Link from "next/link";

import { DogfoodingStageBadge } from "@/src/components/admin/DogfoodingStageBadge";
import { GenerateMagicLinkButton } from "@/src/components/admin/GenerateMagicLinkButton";
import { SendMissionButton } from "@/src/components/admin/SendMissionButton";
import type { DogfoodingUserRowData } from "@/src/lib/adminDogfooding";

type DogfoodingUserRowProps = {
  tester: DogfoodingUserRowData;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function readinessTone(ready: boolean) {
  return ready ? "success" : "danger";
}

function missionTone(label: DogfoodingUserRowData["missionStatusLabel"]) {
  switch (label) {
    case "Sudah Dilaporkan":
      return "success";
    case "Terkirim":
      return "info";
    case "Draft":
      return "warning";
    default:
      return "muted";
  }
}

function actionTone(label: DogfoodingUserRowData["salesActionLabel"]) {
  switch (label) {
    case "Aktif Bergerak":
      return "success";
    case "Mulai Bergerak":
      return "warning";
    default:
      return "muted";
  }
}

function paymentTone(label: DogfoodingUserRowData["paymentSignalLabel"]) {
  switch (label) {
    case "Paid":
      return "success";
    case "Pending":
      return "warning";
    case "Tertarik":
      return "info";
    case "Tidak Lanjut":
      return "danger";
    default:
      return "muted";
  }
}

export function DogfoodingUserRow({ tester }: DogfoodingUserRowProps) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">{tester.name}</p>
          <p className="text-sm text-slate-600">{tester.whatsapp}</p>
          <p className="text-xs text-slate-500">{tester.cohort}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-44 flex-col gap-2">
          <DogfoodingStageBadge
            label={tester.hasBusinessProfile ? "Profil Bisnis Siap" : "Profil Bisnis Belum"}
            tone={readinessTone(tester.hasBusinessProfile)}
          />
          <DogfoodingStageBadge
            label={tester.hasProductFocus ? "Produk Fokus Siap" : "Produk Fokus Belum"}
            tone={readinessTone(tester.hasProductFocus)}
          />
          <DogfoodingStageBadge
            label={tester.consentGiven ? "Consent Ya" : "Consent Belum"}
            tone={readinessTone(tester.consentGiven)}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <DogfoodingStageBadge
            label={tester.telegramConnected ? "Terhubung" : "Belum Terhubung"}
            tone={tester.telegramConnected ? "success" : "danger"}
          />
          <p className="text-sm text-slate-600">
            {tester.telegramUsername ? `@${tester.telegramUsername}` : "-"}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <DogfoodingStageBadge
            label={tester.missionStatusLabel}
            tone={missionTone(tester.missionStatusLabel)}
          />
          <p className="text-sm text-slate-600">{formatDateTime(tester.sentAt)}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            {tester.doneItemsCount} / 3
          </p>
          <DogfoodingStageBadge
            label={tester.salesActionLabel}
            tone={actionTone(tester.salesActionLabel)}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <DogfoodingStageBadge
            label={tester.hasReportToday ? "Sudah Lapor" : "Belum Lapor"}
            tone={tester.hasReportToday ? "success" : "warning"}
          />
          <p className="text-sm text-slate-600">{tester.reportCodeLabel}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <DogfoodingStageBadge
          label={tester.paymentSignalLabel}
          tone={paymentTone(tester.paymentSignalLabel)}
        />
      </td>
      <td className="px-4 py-4">
        <p className="max-w-xs text-sm leading-6 text-slate-700">
          {tester.followUpRecommendation}
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-44 flex-col gap-2">
          <Link
            href={`/admin/users/${tester.userId}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Lihat Detail
          </Link>
          <GenerateMagicLinkButton userId={tester.userId} />
          <SendMissionButton userId={tester.userId} />
        </div>
      </td>
    </tr>
  );
}
