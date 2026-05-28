import { markMissionItemDone } from "@/src/lib/report";
import { verifyAdminSecret } from "@/src/lib/security";

// Internal testing route only. Remove or protect before public beta.
export async function GET(req: Request) {
  if (!verifyAdminSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const missionItemId = url.searchParams.get("mission_item_id");
  const telegramChatId = url.searchParams.get("telegram_chat_id");

  if (!missionItemId || !telegramChatId) {
    return Response.json(
      {
        ok: false,
        error: "Missing mission_item_id or telegram_chat_id query parameter",
      },
      { status: 400 }
    );
  }

  const result = await markMissionItemDone(missionItemId, telegramChatId);

  return Response.json(result);
}
