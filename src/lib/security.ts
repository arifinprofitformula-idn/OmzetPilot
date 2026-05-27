import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type ActivationTokenPayload = {
  sub: string;
  type: "telegram_link";
  user_id: string;
};

const ACTIVATION_TOKEN_VERSION = 1;
const ACTIVATION_TOKEN_TTL_SECONDS = 15 * 60;
const UUID_BYTE_LENGTH = 16;
const EXPIRY_BYTE_LENGTH = 4;
const SIGNATURE_BYTE_LENGTH = 12;
const TOKEN_BODY_LENGTH =
  1 + UUID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH + SIGNATURE_BYTE_LENGTH;

function getActivationSecret() {
  const secret = process.env.JWT_ACTIVATION_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_ACTIVATION_SECRET environment variable");
  }

  return new TextEncoder().encode(secret);
}

function uuidToBytes(uuid: string): Buffer {
  const normalizedUuid = uuid.replace(/-/g, "");

  if (!/^[0-9a-fA-F]{32}$/.test(normalizedUuid)) {
    throw new Error("Invalid user id for activation token");
  }

  return Buffer.from(normalizedUuid, "hex");
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

function getActivationSignature(
  version: number,
  userIdBytes: Buffer,
  expiresAtSeconds: number
): Buffer {
  const expiresAtBuffer = Buffer.alloc(EXPIRY_BYTE_LENGTH);
  expiresAtBuffer.writeUInt32BE(expiresAtSeconds, 0);

  return createHmac("sha256", Buffer.from(getActivationSecret()))
    .update(Buffer.from([version]))
    .update(userIdBytes)
    .update(expiresAtBuffer)
    .digest()
    .subarray(0, SIGNATURE_BYTE_LENGTH);
}

export async function signActivationToken(userId: string): Promise<string> {
  const userIdBytes = uuidToBytes(userId);
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + ACTIVATION_TOKEN_TTL_SECONDS;
  const tokenBuffer = Buffer.alloc(TOKEN_BODY_LENGTH);

  tokenBuffer.writeUInt8(ACTIVATION_TOKEN_VERSION, 0);
  userIdBytes.copy(tokenBuffer, 1);
  tokenBuffer.writeUInt32BE(expiresAtSeconds, 1 + UUID_BYTE_LENGTH);

  getActivationSignature(
    ACTIVATION_TOKEN_VERSION,
    userIdBytes,
    expiresAtSeconds
  ).copy(tokenBuffer, 1 + UUID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH);

  return tokenBuffer.toString("base64url");
}

export async function verifyActivationToken(
  token: string
): Promise<ActivationTokenPayload> {
  const tokenBuffer = Buffer.from(token, "base64url");

  if (tokenBuffer.length !== TOKEN_BODY_LENGTH) {
    throw new Error("Invalid activation token");
  }

  const version = tokenBuffer.readUInt8(0);

  if (version !== ACTIVATION_TOKEN_VERSION) {
    throw new Error("Invalid activation token");
  }

  const userIdBytes = tokenBuffer.subarray(1, 1 + UUID_BYTE_LENGTH);
  const expiresAtSeconds = tokenBuffer.readUInt32BE(1 + UUID_BYTE_LENGTH);
  const signature = tokenBuffer.subarray(
    1 + UUID_BYTE_LENGTH + EXPIRY_BYTE_LENGTH
  );
  const expectedSignature = getActivationSignature(
    version,
    userIdBytes,
    expiresAtSeconds
  );

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

  return {
    sub: userId,
    type: "telegram_link",
    user_id: userId,
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
