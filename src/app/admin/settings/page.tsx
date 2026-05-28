import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { LanguageNote } from "@/src/components/admin/LanguageNote";
import { StatCard } from "@/src/components/admin/StatCard";
import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getAdminSettingsStatus } from "@/src/lib/adminSettings";

export const metadata: Metadata = {
  title: "Pengaturan Sistem | OmzetPilot",
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
          label={ready ? "Siap" : "Belum"}
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
    { label: "Database Siap", ready: settings.hasSupabaseUrl && settings.hasAnonKey && settings.hasServiceRoleKey },
    { label: "Bot Telegram Siap", ready: settings.hasTelegramToken && settings.hasTelegramBotUsername && settings.hasTelegramWebhookSecret },
    { label: "AI Siap", ready: settings.hasOpenAiKey },
    { label: "Jadwal Otomatis Siap", ready: settings.hasCronSecret },
    { label: "Akses Internal Aman", ready: settings.hasAdminSecret },
    { label: "Link Aplikasi Siap", ready: settings.appBaseUrl },
    { label: "Zona Waktu Siap", ready: settings.appTimezone },
    { label: "JWT Aktivasi Siap", ready: settings.hasJwtActivationSecret },
    { label: "Mode Aplikasi Siap", ready: settings.nodeEnv !== "unknown" },
  ];
  const missingRequired = readinessItems.filter((item) => !item.ready).length;

  // TODO: Replace admin secret with proper auth before beta.
  return (
    <>
      <AdminPageHeader
        title="Pengaturan Sistem"
        subtitle="Cek kesiapan koneksi utama tanpa menampilkan data rahasia."
        actions={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Mode Aplikasi</p>
            <p>{settings.nodeEnv}</p>
          </div>
        }
      />

      <LanguageNote />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Kesiapan Sistem
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Nilai rahasia sengaja disembunyikan. Yang tampil di sini hanya status siap atau belum.
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
            label="Total Tester"
            value={settings.totalUsers}
            description="Jumlah tester yang sudah tercatat."
            tone="neutral"
          />
          <StatCard
            label="Telegram Terhubung"
            value={settings.telegramConnectedUsers}
            description="Tester yang sudah terhubung ke Telegram."
            tone="info"
          />
          <StatCard
            label="Total Misi"
            value={settings.totalMissions}
            description="Jumlah misi yang sudah pernah dibuat."
            tone="success"
          />
          <StatCard
            label="Total Laporan"
            value={settings.totalReports}
            description="Jumlah laporan hasil yang sudah masuk."
            tone="warning"
          />
          <StatCard
            label="Total Catatan Sistem"
            value={settings.totalAiLogs}
            description="Jumlah catatan sistem yang sudah tersimpan."
            tone="info"
          />
          <StatCard
            label="Kendala Sistem"
            value={settings.failedAiLogs}
            description="Catatan proses sistem yang perlu dicek."
            tone="danger"
          />
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              Panduan Aksi Internal
            </h2>
            <p className="text-sm leading-6 text-amber-900">
              Tautan ini hanya untuk pengujian internal MVP. Sebelum public beta, ganti dengan akses yang benar-benar terproteksi.
            </p>
            <p className="text-sm leading-6 text-amber-900">
              Rute internal saat ini memakai `ADMIN_SECRET`. Gunakan
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
                Contoh Rute Internal
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Ini hanya template contoh. Nilai rahasia asli tidak pernah ditampilkan di UI.
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
              Peringatan Kesiapan
            </h2>
            <p className="text-sm leading-6 text-rose-900">
              Ada koneksi utama yang belum siap. Uji internal bisa terganggu sampai celah ini diperbaiki.
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-emerald-950">
              Sistem Siap Dipakai Internal
            </h2>
            <p className="text-sm leading-6 text-emerald-900">
              Koneksi utama terlihat siap untuk pengujian internal MVP.
            </p>
          </div>
        </section>
      )}

      {settings.warnings.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              Catatan Sistem
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
