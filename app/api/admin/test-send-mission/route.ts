import { sendMissionToUser } from "@/src/lib/missionDelivery";

// Internal testing route only. TODO: protect this route before wider deployment.
export async function GET(req: Request) {
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
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Mission send failed",
      },
      { status: 500 }
    );
  }
}
