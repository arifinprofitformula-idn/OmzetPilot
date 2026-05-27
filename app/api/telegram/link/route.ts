import { signActivationToken } from "@/src/lib/security";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!botUsername) {
    return Response.json(
      { ok: false, error: "Missing TELEGRAM_BOT_USERNAME" },
      { status: 500 }
    );
  }

  if (!userId) {
    return Response.json(
      { ok: false, error: "Missing user_id query parameter" },
      { status: 400 }
    );
  }

  const token = await signActivationToken(userId);
  const magicLink = `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;

  return Response.json({
    ok: true,
    user_id: userId,
    magic_link: magicLink,
  });
}
