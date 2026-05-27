import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

function getValidatedAppBaseUrl(): string {
  const rawValue = getRequiredEnv("APP_BASE_URL").trim().replace(/\/+$/, "");
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new Error(
      "APP_BASE_URL must be a valid absolute URL, for example https://omzetpilot-mvp.vercel.app"
    );
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use https for Telegram webhooks");
  }

  if (
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname.endsWith(".local")
  ) {
    throw new Error(
      "APP_BASE_URL must be a public domain. Telegram cannot reach localhost or local network URLs."
    );
  }

  if (!parsedUrl.hostname.includes(".")) {
    throw new Error(
      "APP_BASE_URL hostname looks invalid. Use your real Vercel domain, for example https://omzetpilot-mvp.vercel.app"
    );
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

async function main() {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const webhookSecret = getRequiredEnv("TELEGRAM_WEBHOOK_SECRET");
  const appBaseUrl = getValidatedAppBaseUrl();
  const webhookUrl = `${appBaseUrl}/api/telegram/webhook`;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
    }),
  });

  const data = (await response.json()) as TelegramApiResponse;

  if (!data.ok) {
    throw new Error(
      `Failed to set Telegram webhook: ${data.description || "Unknown Telegram API error"}`
    );
  }

  console.log(`Telegram webhook set successfully: ${webhookUrl}`);
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to set Telegram webhook"
  );
  process.exit(1);
});
