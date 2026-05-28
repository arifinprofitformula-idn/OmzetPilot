// Internal diagnostic route only. Remove or protect before public beta.
export async function GET() {
  return Response.json({
    ok: true,
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasTelegramWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    hasTelegramBotUsername: Boolean(process.env.TELEGRAM_BOT_USERNAME),
    hasJwtActivationSecret: Boolean(process.env.JWT_ACTIVATION_SECRET),
    appBaseUrl: process.env.APP_BASE_URL ?? null,
  });
}
