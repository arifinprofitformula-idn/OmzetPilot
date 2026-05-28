import type { Metadata } from "next";
import { connection } from "next/server";

import { AdminPageHeader } from "@/src/components/admin/AdminPageHeader";
import { DogfoodingFunnelCard } from "@/src/components/admin/DogfoodingFunnelCard";
import { DogfoodingUserRow } from "@/src/components/admin/DogfoodingUserRow";
import { SendEveningReportButton } from "@/src/components/admin/SendEveningReportButton";
import { StatCard } from "@/src/components/admin/StatCard";
import { getAdminDogfoodingData } from "@/src/lib/adminDogfooding";

export const metadata: Metadata = {
  title: "Dogfooding Control Panel | OmzetPilot",
  description: "Pantau tester internal OmzetPilot dari onboarding sampai sinyal bayar.",
};

type AdminDogfoodingPageProps = {
  searchParams?: Promise<{
    cohort?: string;
    status?: string;
    date?: string;
  }>;
};

export default async function AdminDogfoodingPage({
  searchParams,
}: AdminDogfoodingPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getAdminDogfoodingData({
    cohort: resolvedSearchParams?.cohort,
    status: resolvedSearchParams?.status,
    date: resolvedSearchParams?.date,
  });

  // TODO: Protect dogfooding page and admin routes with real authentication before public beta.
  return (
    <>
      <AdminPageHeader
        title="Dogfooding Control Panel"
        subtitle="Pantau tester internal dari onboarding sampai sinyal bayar."
        actions={
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Cohort Aktif</p>
              <p>{data.filters.cohort}</p>
            </div>
            <div className="w-full md:w-80">
              <SendEveningReportButton />
            </div>
          </div>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <form
          className="grid gap-4 md:grid-cols-4 md:items-end"
          method="get"
          suppressHydrationWarning
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Cohort</span>
            <input
              type="text"
              name="cohort"
              defaultValue={data.filters.cohort}
              placeholder="alpha_batch_1"
              suppressHydrationWarning
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tanggal</span>
            <input
              type="date"
              name="date"
              defaultValue={data.filters.date}
              suppressHydrationWarning
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              defaultValue={data.filters.status}
              suppressHydrationWarning
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            >
              <option value="all">all</option>
              <option value="ready">ready</option>
              <option value="onboarding_stuck">onboarding_stuck</option>
              <option value="telegram_connected">telegram_connected</option>
              <option value="mission_sent">mission_sent</option>
              <option value="moved">moved</option>
              <option value="reported">reported</option>
              <option value="payment_signal">payment_signal</option>
              <option value="needs_follow_up">needs_follow_up</option>
            </select>
          </label>

          <button
            type="submit"
            suppressHydrationWarning
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tester"
          value={data.summary.totalTester}
          description="Jumlah tester di cohort terpilih."
          tone="neutral"
        />
        <StatCard
          label="Siap Diuji"
          value={data.summary.siapDiuji}
          description="Tester dengan data dasar yang sudah siap."
          tone="success"
        />
        <StatCard
          label="Telegram Terhubung"
          value={data.summary.telegramTerhubung}
          description="Tester yang sudah connect ke Telegram."
          tone="info"
        />
        <StatCard
          label="Misi Terkirim Hari Ini"
          value={data.summary.misiTerkirimHariIni}
          description="Tester yang sudah menerima misi hari ini."
          tone="info"
        />
        <StatCard
          label="Sudah Bergerak Hari Ini"
          value={data.summary.sudahBergerakHariIni}
          description="Tester yang sudah menuntaskan minimal 1 aksi."
          tone="success"
        />
        <StatCard
          label="Sudah Lapor Hari Ini"
          value={data.summary.sudahLaporHariIni}
          description="Tester yang sudah kirim laporan harian."
          tone="warning"
        />
        <StatCard
          label="Perlu Follow Up"
          value={data.summary.perluFollowUp}
          description="Tester yang perlu disentuh manual hari ini."
          tone="danger"
        />
        <StatCard
          label="Ada Sinyal Bayar"
          value={data.summary.adaSinyalBayar}
          description="Tester dengan minat atau aksi bayar."
          tone="success"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Funnel Dogfooding
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Lihat berapa banyak tester yang terus bergerak dari data masuk
              sampai ada sinyal bayar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.funnel.map((step) => (
              <DogfoodingFunnelCard key={step.label} step={step} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Tabel Kontrol Tester
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Fokus ke siapa yang siap diuji, siapa yang sudah bergerak, dan
              siapa yang perlu disentuh manual hari ini.
            </p>
          </div>

          {data.testers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-sm text-slate-600">
              Belum ada tester di cohort ini. Tambahkan tester dari Supabase
              atau halaman Users.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3">Tester</th>
                    <th className="px-4 py-3">Kesiapan Data</th>
                    <th className="px-4 py-3">Telegram</th>
                    <th className="px-4 py-3">Misi Hari Ini</th>
                    <th className="px-4 py-3">Aksi Jualan</th>
                    <th className="px-4 py-3">Laporan</th>
                    <th className="px-4 py-3">Sinyal Bayar</th>
                    <th className="px-4 py-3">Rekomendasi Follow Up</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.testers.map((tester) => (
                    <DogfoodingUserRow key={tester.userId} tester={tester} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {[
          {
            title: "Macet di Onboarding",
            items: data.focusQueues.onboardingStuck,
            empty: "Tidak ada tester yang macet di onboarding.",
          },
          {
            title: "Belum Bergerak Hari Ini",
            items: data.focusQueues.belumBergerak,
            empty: "Semua tester yang dikirimi misi sudah mulai bergerak.",
          },
          {
            title: "Belum Lapor",
            items: data.focusQueues.belumLapor,
            empty: "Tidak ada tester yang tertahan di tahap laporan.",
          },
          {
            title: "Sinyal Bayar",
            items: data.focusQueues.sinyalBayar,
            empty: "Belum ada sinyal bayar yang perlu ditindaklanjuti.",
          },
        ].map((queue) => (
          <section
            key={queue.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {queue.title}
              </h2>

              {queue.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                  {queue.empty}
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.items.map((item) => (
                    <div
                      key={`${queue.title}-${item.userId}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Cara Pakai Panel Ini Hari Ini
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Urutan kerja simpel untuk operator biar tester tidak macet di
              tengah jalan.
            </p>
          </div>

          <ol className="space-y-3">
            {[
              "Cek Macet di Onboarding.",
              "Kirim magic link ke yang belum terhubung Telegram.",
              "Kirim misi ke tester yang sudah siap.",
              "Jam 12:00, follow up yang belum bergerak.",
              "Jam 17:00, pastikan laporan masuk.",
              "Hari ke-7, cek sinyal bayar dan follow up manual.",
            ].map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Target MVP
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Target ini bukan untuk terlihat cantik. Target ini untuk
              memastikan OmzetPilot benar-benar menggerakkan aksi jualan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Mission Delivery Success", ">95%"],
              ["Mission Item Done Rate", ">30%"],
              ["Report Rate", ">30%"],
              ["D7 Active User", ">30%"],
              ["Payment Action Paid", "min 1-3 users"],
              ["Critical Bug", "0"],
            ].map(([label, target]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {target}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.warnings.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-amber-950">
              Catatan Sistem
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
