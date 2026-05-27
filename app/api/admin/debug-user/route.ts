import { signActivationToken } from "@/src/lib/security";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!userId) {
    return Response.json(
      { ok: false, error: "Missing user_id query parameter" },
      { status: 400 }
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, status, telegram_chat_id, telegram_username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return Response.json(
      {
        ok: false,
        error: `Failed to fetch user: ${error.message}`,
      },
      { status: 500 }
    );
  }

  if (!user) {
    return Response.json(
      {
        ok: false,
        error: "User not found",
      },
      { status: 404 }
    );
  }

  const isTelegramLinked = Boolean(user.telegram_chat_id);
  const response: Record<string, unknown> = {
    ok: true,
    user: {
      id: user.id,
      full_name: user.full_name,
      status: user.status,
      telegram_chat_id: user.telegram_chat_id,
      telegram_username: user.telegram_username,
      is_telegram_linked: isTelegramLinked,
    },
  };

  if (!isTelegramLinked) {
    response.next_action = "Open telegram_link_url and press Start in the bot";
    response.telegram_link_url = `${url.origin}/api/telegram/link?user_id=${encodeURIComponent(user.id)}`;

    if (botUsername) {
      const token = await signActivationToken(user.id);
      response.telegram_deep_link = `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;
    }
  }

  return Response.json(response);
}
