import "server-only";

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

type MissionKeyboardItem = {
  id: string;
  mission_order: number;
};

type TelegramInlineKeyboardButton = {
  text: string;
  callback_data: string;
};

type TelegramInlineKeyboardMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable");
}

const telegramApiBaseUrl = `https://api.telegram.org/bot${botToken}`;

function buildTestTelegramResult(
  chatId: string,
  text: string,
  replyMarkup?: unknown
) {
  return {
    simulated: true,
    provider: "telegram",
    chat_id: chatId,
    message_id: 0,
    text,
    reply_markup: replyMarkup ?? null,
  };
}

async function callTelegramApi(
  method: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(`${telegramApiBaseUrl}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TelegramApiResponse;

  if (!data.ok) {
    throw new Error(data.description || `Telegram ${method} failed`);
  }

  return data.result;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: unknown
) {
  if (chatId.startsWith("test:")) {
    return buildTestTelegramResult(chatId, text, replyMarkup);
  }

  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export function buildMissionDoneKeyboard(
  missionItems: MissionKeyboardItem[]
): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: missionItems.map((item) => {
      const callbackData = `done:${item.id}`;

      if (callbackData.length > 64) {
        throw new Error(
          `Mission item callback_data exceeds Telegram limit for item ${item.id}`
        );
      }

      return [
        {
          text: `✅ Misi ${item.mission_order} Selesai`,
          callback_data: callbackData,
        },
      ];
    }),
  };
}
