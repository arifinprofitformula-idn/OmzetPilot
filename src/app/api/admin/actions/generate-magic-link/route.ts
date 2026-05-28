import { signActivationToken } from "@/src/lib/security";
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

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      return Response.json(
        { ok: false, error: "Missing TELEGRAM_BOT_USERNAME" },
        { status: 500 }
      );
    }

    const token = await signActivationToken(userId);

    return Response.json({
      ok: true,
      magicLink: `https://t.me/${botUsername}?start=${token}`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate magic link",
      },
      { status: 500 }
    );
  }
}
