import { sendMissionToUser } from "@/src/lib/missionDelivery";
import { verifyAdminSecret } from "@/src/lib/security";

function buildErrorResponse(req: Request, userId: string, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Mission send failed";

  if (message === "User not found") {
    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 404 }
    );
  }

  if (message === "User does not have telegram_chat_id") {
    const url = new URL(req.url);
    const telegramLinkUrl = `${url.origin}/api/telegram/link?user_id=${encodeURIComponent(
      userId
    )}&admin_secret=YOUR_ADMIN_SECRET`;

    return Response.json(
      {
        ok: false,
        error: message,
        action: "Link Telegram account first",
        telegram_link_url: telegramLinkUrl,
      },
      { status: 409 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: message,
    },
    { status: 500 }
  );
}

// Internal testing route only. TODO: protect this route before wider deployment.
export async function GET(req: Request) {
  if (!verifyAdminSecret(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return Response.json(
      { ok: false, error: "Missing user_id query parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await sendMissionToUser(userId);

    return Response.json({
      ok: true,
      mission: result.mission,
      mission_items: result.mission_items,
      telegram_result: result.telegram_result,
    });
  } catch (error) {
    return buildErrorResponse(req, userId, error);
  }
}
