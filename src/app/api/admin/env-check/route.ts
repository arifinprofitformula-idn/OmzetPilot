import { verifyAdminSecret } from "@/src/lib/security";

// Internal diagnostic route only. Remove or protect before public beta.
export async function GET(req: Request) {
  if (!verifyAdminSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    ok: true,
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
    hasAppBaseUrl: Boolean(process.env.APP_BASE_URL),
    hasAppTimezone: Boolean(process.env.APP_TIMEZONE),
    hasNodeEnv: Boolean(process.env.NODE_ENV),
  });
}
