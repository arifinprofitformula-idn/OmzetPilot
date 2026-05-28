import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type ActivationTokenPayload = {
  purpose: "telegram_link";
  user_id: string;
};

const ACTIVATION_TOKEN_PURPOSE = "telegram_link";
const ACTIVATION_TOKEN_VERSION = 1;
const ACTIVATION_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const USER_ID_BYTE_LENGTH = 16;
const EXPIRY_BYTE_LENGTH = 4;
const SIGNATURE_BYTE_LENGTH = 12;
const TOKEN_BODY_LENGTH =
  1 + USER_ID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH + SIGNATURE_BYTE_LENGTH;
const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

function getActivationSecret(): Buffer {
  return Buffer.from(getRequiredEnv("JWT_ACTIVATION_SECRET"), "utf8");
}

function assertValidUserId(userId: string): void {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new Error("Invalid activation token user_id");
  }
}

function uuidToBytes(userId: string): Buffer {
  assertValidUserId(userId);

  return Buffer.from(userId.replace(/-/g, ""), "hex");
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Buffer.from(bytes).toString("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function signTokenBytes(userIdBytes: Buffer, expiresAtSeconds: number): Buffer {
  const expiryBytes = Buffer.alloc(EXPIRY_BYTE_LENGTH);
  expiryBytes.writeUInt32BE(expiresAtSeconds, 0);

  return createHmac("sha256", getActivationSecret())
    .update(Buffer.from([ACTIVATION_TOKEN_VERSION]))
    .update(userIdBytes)
    .update(expiryBytes)
    .update(ACTIVATION_TOKEN_PURPOSE)
    .digest()
    .subarray(0, SIGNATURE_BYTE_LENGTH);
}

export async function signActivationToken(userId: string): Promise<string> {
  const userIdBytes = uuidToBytes(userId);
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + ACTIVATION_TOKEN_TTL_SECONDS;
  const tokenBytes = Buffer.alloc(TOKEN_BODY_LENGTH);

  tokenBytes.writeUInt8(ACTIVATION_TOKEN_VERSION, 0);
  userIdBytes.copy(tokenBytes, 1);
  tokenBytes.writeUInt32BE(expiresAtSeconds, 1 + USER_ID_BYTE_LENGTH);
  signTokenBytes(userIdBytes, expiresAtSeconds).copy(
    tokenBytes,
    1 + USER_ID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH
  );

  return tokenBytes.toString("base64url");
}

export async function verifyActivationToken(
  token: string
): Promise<ActivationTokenPayload> {
  try {
    const tokenBytes = Buffer.from(token, "base64url");

    if (tokenBytes.length !== TOKEN_BODY_LENGTH) {
      throw new Error("Invalid activation token");
    }

    const version = tokenBytes.readUInt8(0);

    if (version !== ACTIVATION_TOKEN_VERSION) {
      throw new Error("Invalid activation token purpose");
    }

    const userIdBytes = tokenBytes.subarray(1, 1 + USER_ID_BYTE_LENGTH);
    const expiresAtSeconds = tokenBytes.readUInt32BE(1 + USER_ID_BYTE_LENGTH);
    const signature = tokenBytes.subarray(
      1 + USER_ID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH
    );
    const expectedSignature = signTokenBytes(userIdBytes, expiresAtSeconds);

    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(signature, expectedSignature)
    ) {
      throw new Error("Invalid activation token");
    }

    if (expiresAtSeconds < Math.floor(Date.now() / 1000)) {
      throw new Error("Activation token expired");
    }

    const userId = bytesToUuid(userIdBytes);
    assertValidUserId(userId);

    return {
      purpose: ACTIVATION_TOKEN_PURPOSE,
      user_id: userId,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Invalid activation token purpose" ||
        error.message === "Invalid activation token user_id" ||
        error.message === "Activation token expired"
      ) {
        throw error;
      }
    }

    throw new Error("Invalid activation token");
  }
}

export function verifyTelegramSecret(req: Request): boolean {
  const expectedSecret = getRequiredEnv("TELEGRAM_WEBHOOK_SECRET");

  const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");

  return receivedSecret === expectedSecret;
}

export function verifyCronSecret(req: Request): boolean {
  const expectedSecret = getRequiredEnv("CRON_SECRET");

  const url = new URL(req.url);
  const secretFromHeader = req.headers.get("x-cron-secret");
  const secretFromQuery = url.searchParams.get("secret");

  return (
    secretFromHeader === expectedSecret || secretFromQuery === expectedSecret
  );
}
