"use client";

import { useState } from "react";

import { AdminActionButton } from "@/src/components/admin/AdminActionButton";

export function SendEveningReportButton() {
  const [summary, setSummary] = useState<{
    totalEligible: number;
    sentCount: number;
    failedCount: number;
  } | null>(null);

  return (
    <div className="space-y-2">
      <AdminActionButton
        label="Kirim Pengingat Laporan ke Tester"
        loadingLabel="Mengirim Pengingat..."
        successLabel="Pengingat laporan selesai dijalankan."
        endpoint="/api/admin/actions/send-evening-report"
        payload={{ send: true }}
        variant="secondary"
        onSuccess={(data) => {
          const payload = data as {
            totalEligible?: number;
            sentCount?: number;
            failedCount?: number;
          };

          setSummary({
            totalEligible: payload.totalEligible ?? 0,
            sentCount: payload.sentCount ?? 0,
            failedCount: payload.failedCount ?? 0,
          });
        }}
      />

      {summary ? (
        <p className="text-xs leading-5 text-slate-600">
          Siap dikirim: {summary.totalEligible} • Berhasil: {summary.sentCount} •
          Kendala: {summary.failedCount}
        </p>
      ) : null}
    </div>
  );
}
