import { signActivationToken, verifyAdminSecret } from "@/src/lib/security";

export async function GET(req: Request) {
  if (!verifyAdminSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!userId) {
    return Response.json(
      { ok: false, error: "Missing user_id query parameter" },
      { status: 400 }
    );
  }

  if (!botUsername) {
    return Response.json(
      { ok: false, error: "Missing TELEGRAM_BOT_USERNAME" },
      { status: 500 }
    );
  }

  const token = await signActivationToken(userId);
  const magicLink = `https://t.me/${botUsername}?start=${token}`;

  return Response.json({
    ok: true,
    user_id: userId,
    magic_link: magicLink,
  });
}
