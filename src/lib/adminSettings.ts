import "server-only";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export type AdminSettingsStatus = {
  hasSupabaseUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  hasTelegramToken: boolean;
  hasTelegramWebhookSecret: boolean;
  hasTelegramBotUsername: boolean;
  hasJwtActivationSecret: boolean;
  hasCronSecret: boolean;
  hasAdminSecret: boolean;
  hasOpenAiKey: boolean;
  appBaseUrl: boolean;
  appTimezone: boolean;
  nodeEnv: string;
  totalUsers: number;
  telegramConnectedUsers: number;
  totalMissions: number;
  totalReports: number;
  totalAiLogs: number;
  failedAiLogs: number;
  warnings: string[];
};

async function safeCount(
  label: string,
  run: () => PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>
) {
  const result = await run();

  if (result.error) {
    return {
      count: 0,
      warning: `Failed to load ${label}: ${result.error.message}`,
    };
  }

  return {
    count: result.count ?? 0,
    warning: null,
  };
}

export async function getAdminSettingsStatus(): Promise<AdminSettingsStatus> {
  const warnings: string[] = [];

  const [
    totalUsersResult,
    telegramConnectedUsersResult,
    totalMissionsResult,
    totalReportsResult,
    totalAiLogsResult,
    failedAiLogsResult,
  ] = await Promise.all([
    safeCount("total users", () =>
      supabaseAdmin.from("users").select("id", { count: "exact", head: true })
    ),
    safeCount("telegram connected users", () =>
      supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true })
        .not("telegram_chat_id", "is", null)
    ),
    safeCount("total missions", () =>
      supabaseAdmin.from("missions").select("id", { count: "exact", head: true })
    ),
    safeCount("total reports", () =>
      supabaseAdmin
        .from("mission_reports")
        .select("id", { count: "exact", head: true })
    ),
    safeCount("total ai logs", () =>
      supabaseAdmin.from("ai_logs").select("id", { count: "exact", head: true })
    ),
    safeCount("failed ai logs", () =>
      supabaseAdmin
        .from("ai_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
    ),
  ]);

  for (const result of [
    totalUsersResult,
    telegramConnectedUsersResult,
    totalMissionsResult,
    totalReportsResult,
    totalAiLogsResult,
    failedAiLogsResult,
  ]) {
    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasTelegramWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    hasTelegramBotUsername: Boolean(process.env.TELEGRAM_BOT_USERNAME),
    hasJwtActivationSecret: Boolean(process.env.JWT_ACTIVATION_SECRET),
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    appBaseUrl: Boolean(process.env.APP_BASE_URL),
    appTimezone: Boolean(process.env.APP_TIMEZONE),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    totalUsers: totalUsersResult.count,
    telegramConnectedUsers: telegramConnectedUsersResult.count,
    totalMissions: totalMissionsResult.count,
    totalReports: totalReportsResult.count,
    totalAiLogs: totalAiLogsResult.count,
    failedAiLogs: failedAiLogsResult.count,
    warnings,
  };
}
