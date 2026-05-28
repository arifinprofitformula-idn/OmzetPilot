import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

// Internal diagnostic route only. Remove or protect before public beta.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, full_name, telegram_chat_id")
      .limit(1);

    if (error) {
      throw error;
    }

    return Response.json({
      ok: true,
      message: "Supabase admin client can read users",
      sampleUserExists: (data?.length ?? 0) > 0,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown Supabase admin error",
      },
      { status: 500 }
    );
  }
}
