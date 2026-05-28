const friendlyLabels = {
  Dashboard: "Beranda",
  Users: "Tester",
  Missions: "Misi Jualan",
  Reports: "Laporan Hasil",
  "AI Logs": "Kesehatan Sistem",
  Payment: "Sinyal Bayar",
  Settings: "Pengaturan",
  QA: "Cek Kesiapan",
  Dogfooding: "Uji Internal",
  users: "Tester",
  business_profiles: "Profil Bisnis",
  products: "Produk Fokus",
  missions: "Misi Harian",
  mission_items: "Aksi Jualan",
  mission_reports: "Laporan Hasil",
  mission_evaluations: "Evaluasi Harian",
  ai_logs: "Catatan Sistem",
  user_activity_logs: "Riwayat Aktivitas",
  payment_validations: "Sinyal Bayar",
  "Total Users": "Total Tester",
  "Active Users": "Tester Aktif",
  "Telegram Connected": "Telegram Terhubung",
  "Mission Sent Today": "Misi Terkirim Hari Ini",
  "Total RGA": "Total Aksi Jualan",
  "RGA Today": "Aksi Jualan Hari Ini",
  "Reports Today": "Laporan Masuk Hari Ini",
  "Closing Reports": "Ada Closing",
  "AI Failed Today": "Kendala Sistem Hari Ini",
  "Payment Validation": "Sinyal Bayar",
  "AI Logs & System Health": "Kesehatan Sistem",
  "Mission Monitor": "Pantauan Misi Jualan",
  "Reports & RGA": "Laporan Hasil & Aksi Jualan",
  "Users Management": "Kelola Tester",
  "Founder Console": "Ruang Kendali OmzetPilot",
  "Admin Settings": "Pengaturan Sistem",
  "MVP QA Checklist": "Cek Kesiapan MVP",
  "Dogfooding Control Panel": "Panel Uji Internal",
} as const;

const userStatusLabels = {
  active: "Aktif",
  at_risk: "Perlu Dibantu",
  inactive: "Tidak Aktif",
  dropped: "Berhenti",
  backup: "Cadangan",
} as const;

const missionStatusLabels = {
  drafted: "Belum Dikirim",
  sent: "Misi Terkirim",
  reported: "Sudah Lapor",
  missed: "Terlewat",
  cancelled: "Dibatalkan",
} as const;

const missionItemStatusLabels = {
  pending: "Belum Dijalankan",
  done: "Selesai",
  skipped: "Dilewati",
} as const;

const fitScoreLabels = {
  strong_fit: "Sangat Cocok",
  medium_fit: "Cukup Cocok",
  weak_fit: "Kurang Cocok",
  reject: "Tidak Cocok",
} as const;

const reportCodeLabels = {
  "1": "Ada Closing / Uang Masuk",
  "2": "Ada Respon, Belum Closing",
  "3": "Sudah Aksi, Belum Ada Respon",
  "4": "Belum Sempat Jalan",
} as const;

const paymentActionLabels = {
  paid: "Sudah Bayar",
  pending: "Menunggu Bayar",
  no: "Tidak Lanjut",
  not_offered: "Belum Ditawarkan",
} as const;

const offerTypeLabels = {
  founder_trial_extension: "Lanjut Uji Coba",
  founder_plan: "Founder Plan",
} as const;

export const adminNavLabels = {
  dashboard: "Beranda",
  users: "Tester",
  missions: "Misi Jualan",
  reports: "Laporan Hasil",
  aiLogs: "Kesehatan Sistem",
  payment: "Sinyal Bayar",
  settings: "Pengaturan",
  qa: "Cek Kesiapan",
  dogfooding: "Uji Internal",
} as const;

function withFallback<T extends Record<string, string>>(
  map: T,
  value: string | null | undefined
) {
  if (!value) {
    return value ?? "-";
  }

  return map[value as keyof T] ?? value;
}

export function getUserStatusLabel(status: string | null | undefined) {
  return withFallback(userStatusLabels, status);
}

export function getMissionStatusLabel(status: string | null | undefined) {
  return withFallback(missionStatusLabels, status);
}

export function getMissionItemStatusLabel(status: string | null | undefined) {
  return withFallback(missionItemStatusLabels, status);
}

export function getReportCodeLabel(code: string | null | undefined) {
  return withFallback(reportCodeLabels, code);
}

export function getPaymentActionLabel(action: string | null | undefined) {
  return withFallback(paymentActionLabels, action);
}

export function getFitScoreLabel(score: string | null | undefined) {
  return withFallback(fitScoreLabels, score);
}

export function getOfferTypeLabel(offerType: string | null | undefined) {
  return withFallback(offerTypeLabels, offerType);
}

export function getFriendlyLabel(key: string | null | undefined) {
  return withFallback(friendlyLabels, key);
}
