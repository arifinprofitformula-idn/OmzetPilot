import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { StatCard } from "@/src/components/admin/StatCard";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getAdminSettingsStatus } from "@/src/lib/adminSettings";

export const metadata: Metadata = {
  title: "Admin Settings | OmzetPilot",
  description:
    "Review environment readiness, system counts, and internal MVP actions.",
};

function ReadinessItem({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <StatusBadge
          label={ready ? "Ready" : "Missing"}
          tone={ready ? "success" : "danger"}
        />
      </div>
    </div>
  );
}

export default async function AdminSettingsPage() {
  await connection();

  const settings = await getAdminSettingsStatus();
  const readinessItems = [
    { label: "Supabase URL", ready: settings.hasSupabaseUrl },
    { label: "Supabase Anon Key", ready: settings.hasAnonKey },
    { label: "Supabase Service Role Key", ready: settings.hasServiceRoleKey },
    { label: "Telegram Bot Token", ready: settings.hasTelegramToken },
    {
      label: "Telegram Webhook Secret",
      ready: settings.hasTelegramWebhookSecret,
    },
    {
      label: "Telegram Bot Username",
      ready: settings.hasTelegramBotUsername,
    },
    {
      label: "JWT Activation Secret",
      ready: settings.hasJwtActivationSecret,
    },
    { label: "Cron Secret", ready: settings.hasCronSecret },
    { label: "Admin Secret", ready: settings.hasAdminSecret },
    { label: "OpenAI API Key", ready: settings.hasOpenAiKey },
    { label: "APP_BASE_URL", ready: settings.appBaseUrl },
    { label: "APP_TIMEZONE", ready: settings.appTimezone },
    { label: "NODE_ENV", ready: settings.nodeEnv !== "unknown" },
  ];
  const missingRequired = readinessItems.filter((item) => !item.ready).length;

  // TODO: Replace admin secret with proper auth before beta.
  return (
    <>
      <AdminPageHeader
        title="Admin Settings"
        subtitle="Review system readiness, environment configuration, and internal MVP actions."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Node Environment</p>
            <p>{settings.nodeEnv}</p>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Environment Readiness
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Secret values are intentionally hidden. Only readiness status is
                shown here.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {readinessItems.map((item) => (
                <ReadinessItem
                  key={item.label}
                  label={item.label}
                  ready={item.ready}
                />
              ))}
            </div>
          </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Users"
            value={settings.totalUsers}
            description="All users currently stored in Supabase."
            tone="neutral"
          />
          <StatCard
            label="Telegram Connected"
            value={settings.telegramConnectedUsers}
            description="Users with a linked Telegram chat ID."
            tone="info"
          />
          <StatCard
            label="Total Missions"
            value={settings.totalMissions}
            description="Mission records across the MVP system."
            tone="success"
          />
          <StatCard
            label="Total Reports"
            value={settings.totalReports}
            description="Mission report records collected so far."
            tone="warning"
          />
          <StatCard
            label="Total AI Logs"
            value={settings.totalAiLogs}
            description="AI generation log entries currently stored."
            tone="info"
          />
          <StatCard
            label="Failed AI Logs"
            value={settings.failedAiLogs}
            description="Failed AI calls recorded for troubleshooting."
            tone="danger"
          />
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              Internal Actions Guide
            </h2>
            <p className="text-sm leading-6 text-amber-900">
              These links are for internal MVP testing only. Remove or replace
              with authenticated server actions before public beta.
            </p>
            <p className="text-sm leading-6 text-amber-900">
              Internal routes now require `ADMIN_SECRET`. Use
              `?admin_secret=YOUR_ADMIN_SECRET` for temporary browser tests and
              do not share these links publicly.
            </p>
          </div>
      </section>

      <section
        id="internal-route-examples"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Internal Route Examples
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Placeholder templates only. Actual secret values are never
                rendered in the UI.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "/api/admin/env-check?admin_secret=YOUR_ADMIN_SECRET",
                "/api/admin/supabase-admin-check?admin_secret=YOUR_ADMIN_SECRET",
                "/api/telegram/link?user_id=USER_ID&admin_secret=YOUR_ADMIN_SECRET",
                "/api/admin/test-send-mission?user_id=USER_ID&admin_secret=YOUR_ADMIN_SECRET",
                "/api/admin/test-evening-report?send=true&admin_secret=YOUR_ADMIN_SECRET",
              ].map((example) => (
                <code
                  key={example}
                  className="block overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                >
                  {example}
                </code>
              ))}
            </div>
          </div>
      </section>

      {missingRequired > 0 ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-rose-950">
              Configuration Warning
            </h2>
            <p className="text-sm leading-6 text-rose-900">
              One or more required environment values are missing. Internal MVP
              testing may fail until readiness gaps are fixed.
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-emerald-950">
              Environment Ready
            </h2>
            <p className="text-sm leading-6 text-emerald-900">
              System environment looks ready for internal MVP testing.
            </p>
          </div>
        </section>
      )}

      {settings.warnings.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              Warnings
            </h2>
            <div className="space-y-2">
              {settings.warnings.map((warning) => (
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
