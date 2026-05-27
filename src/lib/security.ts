import "server-only";

import { jwtVerify, SignJWT } from "jose";

type ActivationTokenPayload = {
  sub: string;
  type: "telegram_link";
  user_id: string;
};

function getActivationSecret() {
  const secret = process.env.JWT_ACTIVATION_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_ACTIVATION_SECRET environment variable");
  }

  return new TextEncoder().encode(secret);
}

export async function signActivationToken(userId: string): Promise<string> {
  return new SignJWT({
    sub: userId,
    type: "telegram_link",
    user_id: userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getActivationSecret());
}

export async function verifyActivationToken(
  token: string
): Promise<ActivationTokenPayload> {
  const { payload } = await jwtVerify(token, getActivationSecret());

  if (payload.type !== "telegram_link" || typeof payload.sub !== "string") {
    throw new Error("Invalid activation token");
  }

  return {
    sub: payload.sub,
    type: "telegram_link",
    user_id:
      typeof payload.user_id === "string" ? payload.user_id : payload.sub,
  };
}

export function verifyTelegramSecret(req: Request): boolean {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    throw new Error("Missing TELEGRAM_WEBHOOK_SECRET environment variable");
  }

  const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");

  return receivedSecret === expectedSecret;
}

export function verifyCronSecret(req: Request): boolean {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new Error("Missing CRON_SECRET environment variable");
  }

  const url = new URL(req.url);
  const secretFromHeader = req.headers.get("x-cron-secret");
  const secretFromQuery = url.searchParams.get("secret");

  return (
    secretFromHeader === expectedSecret || secretFromQuery === expectedSecret
  );
}
