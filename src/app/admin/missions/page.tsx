import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { MissionMonitorTable } from "@/src/components/admin/MissionMonitorTable";
import { SendEveningReportButton } from "@/src/components/admin/SendEveningReportButton";
import { StatCard } from "@/src/components/admin/StatCard";
import { getAdminMissionsData } from "@/src/lib/adminMissions";

export const metadata: Metadata = {
  title: "Mission Monitor | OmzetPilot",
  description: "Founder mission monitoring dashboard for OmzetPilot.",
};

type AdminMissionsPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
    report?: string;
  }>;
};

export default async function AdminMissionsPage({
  searchParams,
}: AdminMissionsPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminMissionsData({
    date: resolvedSearchParams?.date,
    status: resolvedSearchParams?.status,
    report: resolvedSearchParams?.report,
  });

  // TODO: Protect admin routes with authentication and authorization before public beta.
  return (
    <>
      <AdminPageHeader
        title="Mission Monitor"
        subtitle="Track daily mission delivery, RGA progress, and report status."
        actions={
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Selected Date</p>
              <p>{data.filters.date}</p>
            </div>
            <div className="w-full md:w-80">
              <SendEveningReportButton />
            </div>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <form className="grid gap-4 md:grid-cols-4 md:items-end" method="get">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={data.filters.date}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Mission Status
              </span>
              <select
                name="status"
                defaultValue={data.filters.status}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="drafted">Drafted</option>
                <option value="sent">Sent</option>
                <option value="reported">Reported</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Report Status
              </span>
              <select
                name="report"
                defaultValue={data.filters.report}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="reported">Reported</option>
                <option value="not_reported">Not Reported</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total Missions"
          value={data.summary.totalMissions}
          description="Missions matching the current filter."
          tone="neutral"
        />
          <StatCard
            label="Sent Missions"
            value={data.summary.sentMissions}
            description="Missions already delivered."
            tone="info"
          />
          <StatCard
            label="Reported Missions"
            value={data.summary.reportedMissions}
            description="Missions with a submitted report."
            tone="success"
          />
          <StatCard
            label="Total RGA"
            value={data.summary.totalRga}
            description="Progress counted from reports or done items."
            tone="success"
          />
          <StatCard
            label="Closing Reports"
            value={data.summary.closingReports}
            description="Reports marked as closing outcomes."
            tone="warning"
          />
          <StatCard
            label="Needs Report"
            value={data.summary.needsReport}
            description="Missions still waiting for a report."
            tone="danger"
          />
      </section>

      {data.rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No missions found for the selected filter.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Try a different date or broaden the mission and report filters.
            </p>
          </div>
        </section>
      ) : (
        <MissionMonitorTable rows={data.rows} />
      )}
    </>
  );
}
