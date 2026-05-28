import { sendMissionToUser } from "@/src/lib/missionDelivery";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

type RequestBody = {
  userId?: string;
};

// TODO: Protect this route with real admin authentication before public beta.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const userId = body.userId?.trim();

    if (!userId) {
      return Response.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return Response.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const result = await sendMissionToUser(userId);

    return Response.json({
      ok: true,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Mission send failed",
      },
      { status: 500 }
    );
  }
}
