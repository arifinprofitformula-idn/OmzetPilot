import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { ActivityLogList } from "@/src/components/admin/ActivityLogList";
import { DetailSection } from "@/src/components/admin/DetailSection";
import { GenerateMagicLinkButton } from "@/src/components/admin/GenerateMagicLinkButton";
import { InfoRow } from "@/src/components/admin/InfoRow";
import { MissionItemCard } from "@/src/components/admin/MissionItemCard";
import { SendMissionButton } from "@/src/components/admin/SendMissionButton";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getAdminUserDetailData } from "@/src/lib/adminUserDetail";
import type { Json } from "@/src/types/database.types";

export const metadata: Metadata = {
  title: "User Detail | OmzetPilot",
  description: "Founder detail view for OmzetPilot users.",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
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

function formatBoolean(value: boolean | null) {
  if (value === null) {
    return "-";
  }

  return value ? "Yes" : "No";
}

function getStatusTone(value: string | null | undefined) {
  switch (value) {
    case "active":
    case "done":
    case "connected":
    case "reported":
    case "success":
    case "ready":
    case "true":
      return "success";
    case "at_risk":
    case "drafted":
    case "pending":
    case "medium_fit":
    case "weak_fit":
      return "warning";
    case "backup":
    case "sent":
    case "medium":
      return "info";
    case "dropped":
    case "reject":
    case "failed":
    case "not_connected":
      return "danger";
    case "inactive":
      return "muted";
    default:
      return "neutral";
  }
}

function getFitScoreTone(value: string | null) {
  switch (value) {
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

function summarizeMetadata(value: Json) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const summary = value.slice(0, 4).map((item) => {
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
      ) {
        return String(item);
      }

      return JSON.stringify(item);
    });

    return summary.join(", ").slice(0, 180) || "-";
  }

  const entries = Object.entries(value)
    .slice(0, 6)
    .map(([key, entryValue]) => {
      if (
        typeof entryValue === "string" ||
        typeof entryValue === "number" ||
        typeof entryValue === "boolean"
      ) {
        return `${key}: ${entryValue}`;
      }

      if (entryValue === null) {
        return `${key}: null`;
      }

      return `${key}: ${JSON.stringify(entryValue)}`;
    })
    .join(" | ");

  return entries.slice(0, 240) || "-";
}

export default async function AdminUserDetailPage(
  props: PageProps<"/admin/users/[userId]">
) {
  await connection();

  const { userId } = await props.params;
  const detail = await getAdminUserDetailData(userId);

  // TODO: Protect admin routes with authentication and authorization before public beta.

  if (!detail) {
    return (
      <>
        <AdminPageHeader
          title="User Not Found"
          subtitle="The requested admin user record could not be found."
        />

        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              We could not find that user
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              The record may have been removed or the URL may be incorrect.
            </p>
            <Link
              href="/admin/users"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Users
            </Link>
          </div>
        </section>
      </>
    );
  }

  const {
    user,
    businessProfile,
    productFocus,
    performanceSummary,
    latestMissions,
    recentActivityLogs,
    paymentValidations,
  } = detail;
  const telegramStatus = user.telegram_chat_id ? "connected" : "not_connected";

  return (
    <>
      <AdminPageHeader
        title={user.full_name}
        subtitle="Inspect profile, mission history, reporting behavior, and operational activity for this alpha tester."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={formatLabel(user.status)}
              tone={getStatusTone(user.status)}
            />
            <StatusBadge
              label={telegramStatus === "connected" ? "Connected" : "Not Connected"}
              tone={getStatusTone(telegramStatus)}
            />
            {user.fit_score ? (
              <StatusBadge
                label={formatLabel(user.fit_score)}
                tone={getFitScoreTone(user.fit_score)}
              />
            ) : (
              <StatusBadge label="No Fit Score" tone="muted" />
            )}
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                User Header
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={formatLabel(user.status)}
                  tone={getStatusTone(user.status)}
                />
                <StatusBadge
                  label={telegramStatus === "connected" ? "Connected" : "Not Connected"}
                  tone={getStatusTone(telegramStatus)}
                />
                {user.fit_score ? (
                  <StatusBadge
                    label={formatLabel(user.fit_score)}
                    tone={getFitScoreTone(user.fit_score)}
                  />
                ) : (
                  <StatusBadge label="-" tone="muted" />
                )}
              </div>
            </div>

            <Link
              href="/admin/users"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Users
            </Link>
          </div>
      </section>

      <DetailSection
        title="Quick Actions"
        description="MVP founder tools for Telegram onboarding and mission delivery."
      >
          <div className="grid gap-4 md:grid-cols-3">
            <GenerateMagicLinkButton userId={user.id} />
            <SendMissionButton userId={user.id} />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Telegram Status
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {telegramStatus === "connected" ? "Connected" : "Not Connected"}
              </p>
            </div>
          </div>
      </DetailSection>

      <DetailSection title="User Profile">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoRow label="Full Name" value={user.full_name || "-"} />
            <InfoRow label="WhatsApp Number" value={user.whatsapp_number || "-"} />
            <InfoRow
              label="Telegram Username"
              value={user.telegram_username ? `@${user.telegram_username}` : "-"}
            />
            <InfoRow label="Telegram Chat ID" value={user.telegram_chat_id || "-"} />
            <InfoRow label="Email" value={user.email || "-"} />
            <InfoRow label="Cohort" value={user.cohort_name || "-"} />
            <InfoRow label="Consent Given" value={formatBoolean(user.consent_given)} />
            <InfoRow label="Created At" value={formatDateTime(user.created_at)} />
          </div>
      </DetailSection>

      <DetailSection title="Business Profile">
          {businessProfile ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Business Name" value={businessProfile.business_name} />
              <InfoRow
                label="Business Segment"
                value={businessProfile.business_segment}
              />
              <InfoRow
                label="Product/Service Summary"
                value={businessProfile.product_or_service_summary}
              />
              <InfoRow label="Target Customer" value={businessProfile.target_customer} />
              <InfoRow
                label="Main Sales Channel"
                value={businessProfile.main_sales_channel}
              />
              <InfoRow
                label="Main Sales Problem"
                value={businessProfile.main_sales_problem}
              />
              <InfoRow
                label="Has Customer Database"
                value={businessProfile.has_customer_database}
              />
              <InfoRow label="Contact Estimate" value={businessProfile.contact_estimate} />
              <InfoRow
                label="Current Offer"
                value={businessProfile.current_offer || "-"}
              />
              <InfoRow
                label="Status"
                value={
                  <StatusBadge
                    label={formatLabel(businessProfile.status)}
                    tone={getStatusTone(businessProfile.status)}
                  />
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No business profile found for this user yet.
            </div>
          )}
      </DetailSection>

      <DetailSection title="Product Focus">
          {productFocus ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Product Name" value={productFocus.product_name} />
              <InfoRow
                label="Description"
                value={productFocus.product_description || "-"}
              />
              <InfoRow label="Price" value={formatCurrency(productFocus.price)} />
              <InfoRow
                label="Availability Status"
                value={productFocus.availability_status || "-"}
              />
              <InfoRow
                label="Is Primary"
                value={productFocus.is_primary ? "Yes" : "No"}
              />
              <InfoRow label="Notes" value={productFocus.notes || "-"} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No product focus found for this user yet.
            </div>
          )}
      </DetailSection>

      <DetailSection title="Performance Summary">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoRow
              label="Total Mission Days"
              value={performanceSummary?.total_mission_days ?? 0}
            />
            <InfoRow label="Total RGA" value={performanceSummary?.total_rga ?? 0} />
            <InfoRow
              label="Total Reports"
              value={performanceSummary?.total_reports ?? 0}
            />
            <InfoRow
              label="Total Responses"
              value={performanceSummary?.total_responses ?? 0}
            />
            <InfoRow
              label="Total Closings"
              value={performanceSummary?.total_closings ?? 0}
            />
            <InfoRow
              label="Total Revenue"
              value={formatCurrency(performanceSummary?.total_revenue ?? 0)}
            />
          </div>
      </DetailSection>

      <DetailSection
        title="Latest Missions"
        description="Most recent seven mission days, including item completion and report outcomes."
      >
          {latestMissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No missions available for this user yet.
            </div>
          ) : (
            <div className="space-y-6">
              {latestMissions.map(({ mission, items, report, evaluation }) => (
                <article
                  key={mission.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        Mission {mission.mission_date}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          label={formatLabel(mission.mission_status)}
                          tone={getStatusTone(mission.mission_status)}
                        />
                        <StatusBadge
                          label={formatLabel(mission.delivery_channel)}
                          tone="info"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">
                      Sent at: {formatDateTime(mission.sent_at)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoRow label="Mission Date" value={mission.mission_date} />
                    <InfoRow
                      label="Mission Status"
                      value={formatLabel(mission.mission_status)}
                    />
                    <InfoRow
                      label="Delivery Channel"
                      value={formatLabel(mission.delivery_channel)}
                    />
                    <InfoRow label="Sent At" value={formatDateTime(mission.sent_at)} />
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-900">
                      Mission Items
                    </p>
                    {items.length === 0 ? (
                      <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                        No mission items found.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {items.map((item) => (
                          <MissionItemCard
                            key={item.id}
                            item={item}
                            formatDateTime={formatDateTime}
                            formatLabel={formatLabel}
                            getStatusTone={getStatusTone}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">Report</p>
                      {report ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <InfoRow label="Report Code" value={report.report_code} />
                          <InfoRow label="RGA Count" value={report.rga_count} />
                          <InfoRow
                            label="Closing Status"
                            value={report.closing_status ? "Yes" : "No"}
                          />
                          <InfoRow
                            label="Revenue Amount"
                            value={formatCurrency(report.revenue_amount)}
                          />
                          <InfoRow
                            label="Obstacle"
                            value={report.obstacle || "-"}
                          />
                          <InfoRow
                            label="Reported At"
                            value={formatDateTime(report.reported_at)}
                          />
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-600">
                          No report submitted for this mission.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Evaluation
                      </p>
                      {evaluation ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <InfoRow
                            label="Evaluation Status"
                            value={evaluation.evaluation_status}
                          />
                          <InfoRow
                            label="Created At"
                            value={formatDateTime(evaluation.created_at)}
                          />
                          <InfoRow
                            label="Insight Summary"
                            value={evaluation.insight_summary || "-"}
                          />
                          <InfoRow
                            label="Recommendation"
                            value={evaluation.recommendation_next_day || "-"}
                          />
                          <InfoRow
                            label="Admin Note"
                            value={evaluation.admin_note || "-"}
                          />
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-600">
                          No evaluation recorded for this mission yet.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </DetailSection>

      <DetailSection title="Recent Activity Logs">
        <ActivityLogList
          logs={recentActivityLogs}
          formatDateTime={formatDateTime}
          summarizeMetadata={summarizeMetadata}
        />
      </DetailSection>

      <DetailSection title="Payment Validation">
          {paymentValidations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No payment validation records available.
            </div>
          ) : (
            <div className="space-y-4">
              {paymentValidations.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoRow label="Offer Type" value={payment.offer_type} />
                    <InfoRow
                      label="Verbal Intent"
                      value={payment.verbal_intent || "-"}
                    />
                    <InfoRow
                      label="Commitment Action"
                      value={formatBoolean(payment.commitment_action)}
                    />
                    <InfoRow
                      label="Payment Action"
                      value={payment.payment_action}
                    />
                    <InfoRow
                      label="Amount Paid"
                      value={formatCurrency(payment.amount_paid)}
                    />
                    <InfoRow
                      label="Payment Date"
                      value={formatDate(payment.payment_date)}
                    />
                    <InfoRow
                      label="Reason If No"
                      value={payment.reason_if_no || "-"}
                    />
                    <InfoRow
                      label="Follow Up Date"
                      value={formatDate(payment.follow_up_date)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
      </DetailSection>
    </>
  );
}
