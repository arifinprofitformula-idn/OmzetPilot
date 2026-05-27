import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const data = (await response.json()) as unknown;

  console.log(JSON.stringify(data, null, 2));
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to get Telegram webhook info"
  );
  process.exit(1);
});
