import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import {
  getTodayMissionForTelegramChat,
  markMissionItemDone,
  submitMissionReport,
} from "@/src/lib/report";
import { verifyActivationToken, verifyTelegramSecret } from "@/src/lib/security";
import {
  answerCallbackQuery,
  buildReportCodeKeyboard,
  sendTelegramMessage,
} from "@/src/lib/telegram";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    chat?: {
      id?: number;
    };
    from?: {
      username?: string;
    };
    text?: string;
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      chat?: { id?: number };
    };
  };
};

// Temporary warm-instance dedupe. Persistent dedupe should move to a
// dedicated webhook_events table later.
const processedUpdateIds = new Set<number>();

function extractStartPayload(text?: string) {
  if (!text) {
    return null;
  }

  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/);

  if (!match) {
    return null;
  }

  return match[1]?.trim() || null;
}

function getChatContext(update: TelegramUpdate) {
  return {
    chatId: update.message?.chat?.id,
    text: update.message?.text,
    telegramUsername: update.message?.from?.username ?? null,
  };
}

function getCallbackQueryContext(update: TelegramUpdate) {
  return {
    callbackQueryId: update.callback_query?.id,
    callbackData: update.callback_query?.data,
    callbackChatId: update.callback_query?.message?.chat?.id,
  };
}

function buildTelegramUpdateDedupeKey(update: TelegramUpdate): string | null {
  if (typeof update.update_id !== "number") {
    return null;
  }

  return `telegram_update:${update.update_id}`;
}

async function hasProcessedTelegramUpdate(updateId: number): Promise<boolean> {
  if (processedUpdateIds.has(updateId)) {
    return true;
  }

  try {
    const dedupeKey = `telegram_update:${updateId}`;
    const { data, error } = await supabaseAdmin
      .from("user_activity_logs")
      .select("created_at")
      .eq("metadata->>dedupe_key", dedupeKey)
      .limit(1);

    if (error) {
      console.error("Failed to check Telegram update dedupe state", {
        update_id: updateId,
        error: error.message,
      });

      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error("Unexpected Telegram dedupe check failure", {
      update_id: updateId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return false;
  }
}

function logTelegramUpdateProcessed(
  updateId: number,
  chatId: number | undefined,
  status: string
): void {
  if (processedUpdateIds.size > 1000) {
    processedUpdateIds.clear();
  }

  processedUpdateIds.add(updateId);

  console.info("Telegram update processed", {
    update_id: updateId,
    chat_id: chatId ? String(chatId) : null,
    status,
  });
}

async function safeSendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: unknown
) {
  try {
    await sendTelegramMessage(chatId, text, replyMarkup);
  } catch (error) {
    console.error("Failed to send Telegram message", {
      chat_id: chatId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function safeAnswerCallbackQuery(
  callbackQueryId: string | undefined,
  text: string
) {
  if (!callbackQueryId) {
    return;
  }

  try {
    await answerCallbackQuery(callbackQueryId, text);
  } catch (error) {
    console.error("Failed to answer Telegram callback query", {
      callback_query_id: callbackQueryId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function parseReportCallbackData(
  callbackData: string | undefined
): { missionId: string; reportCode: "1" | "2" | "3" | "4" } | null {
  if (!callbackData) {
    return null;
  }

  if (callbackData.startsWith("r:")) {
    const parts = callbackData.split(":");

    if (parts.length !== 3) {
      return null;
    }

    const [, missionId, reportCode] = parts;

    if (!["1", "2", "3", "4"].includes(reportCode)) {
      return null;
    }

    return {
      missionId,
      reportCode: reportCode as "1" | "2" | "3" | "4",
    };
  }

  if (callbackData.startsWith("report:")) {
    const parts = callbackData.split(":");

    if (parts.length !== 3) {
      return null;
    }

    const [, missionId, reportCode] = parts;

    if (!["1", "2", "3", "4"].includes(reportCode)) {
      return null;
    }

    return {
      missionId,
      reportCode: reportCode as "1" | "2" | "3" | "4",
    };
  }

  return null;
}

export async function POST(req: Request) {
  if (!verifyTelegramSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;

  if (!update || typeof update !== "object") {
    return Response.json(
      { ok: false, error: "Invalid Telegram update payload" },
      { status: 400 }
    );
  }

  const { chatId, text, telegramUsername } = getChatContext(update);
  const { callbackChatId, callbackData, callbackQueryId } =
    getCallbackQueryContext(update);
  const updateId = update.update_id;
  const parsedReportCallback = parseReportCallbackData(callbackData);

  if (typeof updateId === "number") {
    if (processedUpdateIds.has(updateId)) {
      return Response.json({ ok: true, duplicate: true });
    }

    const wasProcessed = await hasProcessedTelegramUpdate(updateId);

    if (wasProcessed) {
      processedUpdateIds.add(updateId);

      return Response.json({ ok: true, duplicate: true });
    }

    logTelegramUpdateProcessed(updateId, chatId ?? callbackChatId, "received");
  }

  if (callbackData?.startsWith("done:")) {
    const missionItemId = callbackData.slice("done:".length).trim();

    if (!callbackChatId || !missionItemId) {
      await safeAnswerCallbackQuery(callbackQueryId, "Misi tidak ditemukan.");

      return Response.json({
        ok: true,
        callback: "mission_item_done",
        status: "not_found",
      });
    }

    try {
      const result = await markMissionItemDone(
        missionItemId,
        String(callbackChatId)
      );

      if (result.status === "done") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Mantap Kak. Misi sudah dicatat selesai ✅"
        );
        await safeSendTelegramMessage(
          String(callbackChatId),
          "Mantap Kak. Misi ini sudah dicatat selesai ✅"
        );
      } else if (result.status === "duplicate") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Misi ini sudah tercatat sebelumnya ✅"
        );
      } else if (result.status === "not_found") {
        await safeAnswerCallbackQuery(callbackQueryId, "Misi tidak ditemukan.");
      } else if (result.status === "user_not_found") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Akun Telegram belum terhubung."
        );
      }

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(
          updateId,
          callbackChatId,
          `mission_item_done:${result.status}`
        );
      }

      return Response.json({
        ok: true,
        callback: "mission_item_done",
        status: result.status,
      });
    } catch (error) {
      console.error("Failed to handle mission item done callback", {
        callback_query_id: callbackQueryId ?? null,
        chat_id: String(callbackChatId),
        mission_item_id: missionItemId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await safeAnswerCallbackQuery(
        callbackQueryId,
        "Ada gangguan sistem. Coba lagi sebentar ya."
      );

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(
          updateId,
          callbackChatId,
          "mission_item_done:error"
        );
      }

      return Response.json({
        ok: true,
        callback: "mission_item_done",
        status: "error",
      });
    }
  }

  if (parsedReportCallback) {
    const { missionId, reportCode } = parsedReportCallback;

    if (!callbackChatId) {
      await safeAnswerCallbackQuery(callbackQueryId, "Misi tidak ditemukan.");

      return Response.json({
        ok: true,
        callback: "mission_report",
        status: "mission_not_found",
      });
    }

    try {
      const result = await submitMissionReport(
        missionId,
        String(callbackChatId),
        reportCode
      );

      if (result.status === "reported") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Laporan hari ini sudah tercatat ✅"
        );
        await safeSendTelegramMessage(
          String(callbackChatId),
          "Terima kasih Kak. Laporan hari ini sudah tercatat ✅"
        );
      } else if (result.status === "duplicate") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Laporan hari ini sudah tercatat sebelumnya ✅"
        );
      } else if (result.status === "mission_not_found") {
        await safeAnswerCallbackQuery(callbackQueryId, "Misi tidak ditemukan.");
      } else if (result.status === "user_not_found") {
        await safeAnswerCallbackQuery(
          callbackQueryId,
          "Akun Telegram belum terhubung."
        );
      }

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(
          updateId,
          callbackChatId,
          `mission_report:${result.status}`
        );
      }

      return Response.json({
        ok: true,
        callback: "mission_report",
        status: result.status,
      });
    } catch (error) {
      console.error("Failed to handle mission report callback", {
        callback_query_id: callbackQueryId ?? null,
        chat_id: String(callbackChatId),
        mission_id: missionId,
        report_code: reportCode,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await safeAnswerCallbackQuery(
        callbackQueryId,
        "Ada gangguan sistem. Coba lagi sebentar ya."
      );

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(updateId, callbackChatId, "mission_report:error");
      }

      return Response.json({
        ok: true,
        callback: "mission_report",
        status: "error",
      });
    }
  }

  if (!chatId) {
    return Response.json({ ok: true, ignored: true });
  }

  const startPayload = extractStartPayload(text);

  if (text?.trim().startsWith("/start")) {
    if (!startPayload) {
      await safeSendTelegramMessage(
        String(chatId),
        "Halo Kak, selamat datang di OmzetPilot.\n\nAkun Telegram Kakak belum terhubung. Silakan gunakan magic link dari admin OmzetPilot untuk menghubungkan akun."
      );

      return Response.json({ ok: true, command: "start_without_token" });
    }

    try {
      const payload = await verifyActivationToken(startPayload);
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          telegram_chat_id: String(chatId),
          telegram_username: telegramUsername,
          status: "active",
        })
        .eq("id", payload.user_id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update user Telegram link: ${error.message}`);
      }

      if (!data) {
        throw new Error(
          `Failed to update user Telegram link: user ${payload.user_id} not found`
        );
      }

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(updateId, chatId, "telegram_linked");
      }

      await safeSendTelegramMessage(
        String(chatId),
        "Berhasil Kak.\n\nAkun Telegram Kakak sudah terhubung dengan OmzetPilot. Mulai berikutnya, misi jualan harian akan dikirim lewat bot ini."
      );

      return Response.json({
        ok: true,
        command: "telegram_linked",
        user_id: payload.user_id,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Telegram link error";

      if (
        message === "Invalid activation token" ||
        message === "Activation token expired" ||
        message === "Invalid activation token purpose" ||
        message === "Invalid activation token user_id"
      ) {
        if (typeof updateId === "number") {
          logTelegramUpdateProcessed(updateId, chatId, "invalid_activation_token");
        }

        await safeSendTelegramMessage(
          String(chatId),
          "Maaf Kak, link aktivasi ini tidak valid atau sudah kedaluwarsa.\n\nSilakan minta magic link terbaru dari admin OmzetPilot."
        );

        return Response.json({
          ok: true,
          command: "invalid_activation_token",
        });
      }

      console.error("Failed to link Telegram account", {
        chat_id: String(chatId),
        telegram_username: telegramUsername,
        error: message,
      });

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(updateId, chatId, "telegram_link_failed");
      }

      await safeSendTelegramMessage(
        String(chatId),
        "Maaf Kak, akun Telegram belum berhasil dihubungkan karena ada gangguan sistem di OmzetPilot. Tim kami perlu cek koneksi database terlebih dulu."
      );

      return Response.json(
        {
          ok: false,
          command: "telegram_link_failed",
          error: message,
        },
        { status: 500 }
      );
    }
  }

  if (text?.trim() === "/report") {
    try {
      const result = await getTodayMissionForTelegramChat(String(chatId));

      if (result.status === "user_not_found") {
        await safeSendTelegramMessage(
          String(chatId),
          "Akun Telegram Kakak belum terhubung dengan OmzetPilot."
        );
      } else if (result.status === "no_mission") {
        await safeSendTelegramMessage(
          String(chatId),
          "Misi hari ini belum tersedia, Kak."
        );
      } else if (result.status === "already_reported") {
        await safeSendTelegramMessage(
          String(chatId),
          "Laporan hari ini sudah tercatat, Kak."
        );
      } else if (result.status === "ready") {
        await safeSendTelegramMessage(
          String(chatId),
          "Laporan OmzetPilot Hari Ini\n\nKak, cukup pilih angka yang paling menggambarkan hasil jualan hari ini:\n\n1 = Misi selesai & ADA closing / uang masuk 🔥\n2 = Misi selesai & ada respon, tapi belum closing ⏳\n3 = Misi selesai, tapi belum ada respon 💨\n4 = Belum sempat menjalankan misi 🏃\n\nPilih salah satu:",
          buildReportCodeKeyboard(result.mission.id)
        );
      }

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(
          updateId,
          chatId,
          `report_command:${result.status}`
        );
      }

      return Response.json({
        ok: true,
        command: "report",
        status: result.status,
      });
    } catch (error) {
      console.error("Failed to handle /report command", {
        chat_id: String(chatId),
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await safeSendTelegramMessage(
        String(chatId),
        "Maaf Kak, laporan hari ini belum bisa diproses karena ada gangguan sistem."
      );

      if (typeof updateId === "number") {
        logTelegramUpdateProcessed(updateId, chatId, "report_command:error");
      }

      return Response.json({
        ok: true,
        command: "report",
        status: "error",
      });
    }
  }

  await safeSendTelegramMessage(
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
