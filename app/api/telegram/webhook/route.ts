import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { verifyActivationToken, verifyTelegramSecret } from "@/src/lib/security";
import { sendTelegramMessage } from "@/src/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
    };
    from?: {
      username?: string;
    };
    text?: string;
  };
};

function extractStartPayload(text?: string) {
  if (!text) {
    return null;
  }

  const parts = text.trim().split(/\s+/);

  if (parts[0] !== "/start") {
    return null;
  }

  return parts[1] || null;
}

export async function POST(req: Request) {
  if (!verifyTelegramSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text;
  const telegramUsername = update.message?.from?.username;

  if (!chatId) {
    return Response.json({ ok: true, ignored: true });
  }

  const startPayload = extractStartPayload(text);

  if (text?.startsWith("/start")) {
    if (!startPayload) {
      await sendTelegramMessage(
        String(chatId),
        "Halo Kak, selamat datang di OmzetPilot.\n\nAkun Telegram Kakak belum terhubung. Silakan gunakan magic link dari admin OmzetPilot untuk menghubungkan akun."
      );

      return Response.json({ ok: true, command: "start_without_token" });
    }

    try {
      const payload = await verifyActivationToken(startPayload);

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          telegram_chat_id: String(chatId),
          telegram_username: telegramUsername || null,
          status: "active",
        })
        .eq("id", payload.user_id);

      if (error) {
        throw error;
      }

      await sendTelegramMessage(
        String(chatId),
        "Berhasil Kak.\n\nAkun Telegram Kakak sudah terhubung dengan OmzetPilot. Mulai berikutnya, misi jualan harian akan dikirim lewat bot ini."
      );

      return Response.json({
        ok: true,
        command: "telegram_linked",
        user_id: payload.user_id,
      });
    } catch (error) {
      await sendTelegramMessage(
        String(chatId),
        "Maaf Kak, link aktivasi ini tidak valid atau sudah kedaluwarsa.\n\nSilakan minta magic link terbaru dari admin OmzetPilot."
      );

      return Response.json(
        {
          ok: false,
          command: "invalid_activation_token",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }
  }

  await sendTelegramMessage(
    String(chatId),
    "OmzetPilot sudah menerima pesan Kakak. Untuk saat ini, silakan gunakan /start melalui magic link aktivasi."
  );

  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "omzetpilot-telegram-webhook",
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}
