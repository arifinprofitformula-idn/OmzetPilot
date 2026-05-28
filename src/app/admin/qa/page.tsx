import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { GenerateMagicLinkButton } from "@/src/components/admin/GenerateMagicLinkButton";
import { LanguageNote } from "@/src/components/admin/LanguageNote";
import { QaChecklistSection } from "@/src/components/admin/QaChecklistSection";
import { QaMetricCard } from "@/src/components/admin/QaMetricCard";
import { QaRunbookCard } from "@/src/components/admin/QaRunbookCard";
import { QaStatusBadge } from "@/src/components/admin/QaStatusBadge";
import { SendEveningReportButton } from "@/src/components/admin/SendEveningReportButton";
import { SendMissionButton } from "@/src/components/admin/SendMissionButton";
import { getAdminQaData } from "@/src/lib/adminQa";

export const metadata: Metadata = {
  title: "Cek Kesiapan MVP | OmzetPilot",
  description:
    "Founder QA validation page for OmzetPilot internal MVP readiness.",
};

function formatPercent(value: number) {
  return `${value}%`;
}

export default async function AdminQaPage() {
  await connection();

  const data = await getAdminQaData();

  // TODO: Protect QA page and admin routes with real authentication before public beta.
  return (
    <>
      <AdminPageHeader
        title="Cek Kesiapan MVP"
        subtitle="Pastikan alur utama OmzetPilot berjalan sebelum uji internal dan paid beta."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Hari Ini (WIB)</p>
            <p>{data.todayWib}</p>
          </div>
        }
      />

      <LanguageNote />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <QaMetricCard label="Total Users" value={data.summary.totalUsers} />
        <QaMetricCard
          label="Telegram Connected Users"
          value={data.summary.telegramConnectedUsers}
          tone="info"
        />
        <QaMetricCard
          label="Users with Business Profile"
          value={data.summary.usersWithBusinessProfile}
          tone="success"
        />
        <QaMetricCard
          label="Users with Product Focus"
          value={data.summary.usersWithProductFocus}
          tone="success"
        />
        <QaMetricCard
          label="Missions Today"
          value={data.summary.missionsToday}
          tone="info"
        />
        <QaMetricCard
          label="Mission Items Done Today"
          value={data.summary.missionItemsDoneToday}
          tone="success"
        />
        <QaMetricCard
          label="Reports Today"
          value={data.summary.reportsToday}
          tone="warning"
        />
        <QaMetricCard
          label="AI Failed Today"
          value={data.summary.aiFailedToday}
          tone={data.summary.aiFailedToday > 0 ? "danger" : "success"}
        />
        <QaMetricCard
          label="Payment Validations"
          value={data.summary.paymentValidations}
          tone="info"
        />
        <QaMetricCard
          label="Critical Readiness Score"
          value={formatPercent(data.summary.criticalReadinessScore)}
          tone={
            data.summary.criticalReadinessScore >= 80
              ? "success"
              : data.summary.criticalReadinessScore >= 50
                ? "warning"
                : "danger"
          }
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              QA Action Buttons
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Use these founder tools for quick QA runs, or continue from the
              Users and Missions pages if you need more context.
            </p>
          </div>

          {data.testUserId ? (
            <div className="grid gap-4 md:grid-cols-3">
              <GenerateMagicLinkButton userId={data.testUserId} />
              <SendMissionButton userId={data.testUserId} />
              <SendEveningReportButton />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No test user available yet. Run action buttons from Users or
              Missions page after creating a user.
            </div>
          )}
        </div>
      </section>

      {data.checklistSections.map((section) => (
        <QaChecklistSection key={section.title} section={section} />
      ))}

      <QaRunbookCard steps={data.runbookSteps} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Critical Bugs Watchlist
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Critical issues here should be zero before internal dogfooding at
              scale.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Bug</th>
                  <th className="px-4 py-3">Expected Status</th>
                  <th className="px-4 py-3">Related Check</th>
                  <th className="px-4 py-3">Current Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.criticalBugsWatchlist.map((item) => (
                  <tr key={item.bug}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {item.bug}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {item.expectedStatus}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {item.relatedCheck}
                    </td>
                    <td className="px-4 py-4">
                      <QaStatusBadge
                        status={item.criticalCount === 0 ? "pass" : "fail"}
                      />
                      <p className="mt-2 text-sm text-slate-700">
                        {item.criticalCount}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Release Criteria
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              MVP is ready for broader internal testing only when this list is
              comfortably green in practice.
            </p>
          </div>

          <div className="grid gap-3">
            {data.releaseCriteria.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.warnings.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              QA Warnings
            </h2>
            <div className="space-y-2">
              {data.warnings.map((warning) => (
                <p key={warning} className="text-sm leading-6 text-amber-900">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
