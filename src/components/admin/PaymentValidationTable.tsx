import Link from "next/link";

import { PaymentStatusBadge } from "@/src/components/admin/PaymentStatusBadge";
import type { AdminPaymentRow } from "@/src/lib/adminPayment";

type PaymentValidationTableProps = {
  rows: AdminPaymentRow[];
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

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
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

export function PaymentValidationTable({
  rows,
}: PaymentValidationTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Created At</th>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Cohort</th>
              <th className="px-5 py-4">Offer Type</th>
              <th className="px-5 py-4">Verbal Intent</th>
              <th className="px-5 py-4">Commitment Action</th>
              <th className="px-5 py-4">Payment Action</th>
              <th className="px-5 py-4">Amount Paid</th>
              <th className="px-5 py-4">Payment Method</th>
              <th className="px-5 py-4">Payment Date</th>
              <th className="px-5 py-4">Reason If No</th>
              <th className="px-5 py-4">Follow Up Date</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.paymentValidation.id} className="align-top">
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDateTime(row.paymentValidation.created_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {row.user?.full_name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.user?.whatsapp_number ?? row.paymentValidation.user_id}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.cohort ?? "-"}
                </td>
                <td className="px-5 py-4">
                  <PaymentStatusBadge
                    kind="offer_type"
                    value={row.paymentValidation.offer_type}
                  />
                </td>
                <td className="px-5 py-4">
                  <PaymentStatusBadge
                    kind="verbal_intent"
                    value={row.paymentValidation.verbal_intent}
                  />
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.paymentValidation.commitment_action ? "Yes" : "No"}
                </td>
                <td className="px-5 py-4">
                  <PaymentStatusBadge
                    kind="payment_action"
                    value={row.paymentValidation.payment_action}
                  />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(row.paymentValidation.amount_paid)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.paymentValidation.payment_method ?? "-"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDate(row.paymentValidation.payment_date)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {row.paymentValidation.reason_if_no ?? "-"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {formatDate(row.paymentValidation.follow_up_date)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/users/${row.paymentValidation.user_id}`}
                    className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    View User Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
