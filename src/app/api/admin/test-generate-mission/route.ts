import { generateMissionForUser } from "@/src/lib/mission";

// Local/internal testing only. Remove or protect this route before wider deployment.
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
    const result = await generateMissionForUser(userId);

    return Response.json({
      ok: true,
      mission: result.mission,
      mission_items: result.mission_items,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Mission generation failed",
      },
      { status: 500 }
    );
  }
}
