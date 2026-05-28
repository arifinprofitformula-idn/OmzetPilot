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
        label="Send Evening Report to Eligible Users"
        loadingLabel="Sending Evening Reports..."
        successLabel="Evening report action completed."
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
          Eligible: {summary.totalEligible} • Sent: {summary.sentCount} • Failed:{" "}
          {summary.failedCount}
        </p>
      ) : null}
    </div>
  );
}
