import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";

type ReadinessCheck = {
  label: string;
  ok: boolean;
  detail: string;
};

function buildNextAction(checks: ReadinessCheck[]): string {
  const failedCheck = checks.find((check) => !check.ok);

  if (!failedCheck) {
    return "Ready to call /api/admin/test-send-mission";
  }

  return failedCheck.detail;
}

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
    const missionDate = getTodayInJakarta();

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, status, telegram_chat_id, telegram_username")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (!user) {
      return Response.json(
        {
          ok: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const { data: businessProfiles, error: businessProfileError } =
      await supabaseAdmin
        .from("business_profiles")
        .select("id, business_name, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

    if (businessProfileError) {
      throw new Error(
        `Failed to fetch business profile: ${businessProfileError.message}`
      );
    }

    const businessProfile = businessProfiles[0] ?? null;

    const { data: products, error: productError } = businessProfile
      ? await supabaseAdmin
          .from("products")
          .select("id, product_name, is_primary, availability_status")
          .eq("user_id", userId)
          .eq("business_profile_id", businessProfile.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
      : { data: [], error: null };

    if (productError) {
      throw new Error(`Failed to fetch product: ${productError.message}`);
    }

    const product = products[0] ?? null;

    const { data: missions, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("id, mission_status, mission_date, sent_at")
      .eq("user_id", userId)
      .eq("mission_date", missionDate)
      .limit(1);

    if (missionError) {
      throw new Error(`Failed to fetch existing mission: ${missionError.message}`);
    }

    const existingMission = missions[0] ?? null;
    const hasTelegramChatId = Boolean(user.telegram_chat_id);
    const usesTestTelegram = user.telegram_chat_id?.startsWith("test:") ?? false;

    const checks: ReadinessCheck[] = [
      {
        label: "user_exists",
        ok: true,
        detail: "User found",
      },
      {
        label: "telegram_linked",
        ok: hasTelegramChatId,
        detail: hasTelegramChatId
          ? usesTestTelegram
            ? "Telegram is linked in test simulation mode"
            : "Telegram is linked"
          : "Link Telegram first via /api/telegram/link",
      },
      {
        label: "active_business_profile",
        ok: Boolean(businessProfile),
        detail: businessProfile
          ? "Active business profile found"
          : "Create an active business profile first",
      },
      {
        label: "primary_product",
        ok: Boolean(product),
        detail: product ? "Product found" : "Create at least one product first",
      },
    ];

    return Response.json({
      ok: true,
      user_id: userId,
      mission_date: missionDate,
      can_send_mission: checks.every((check) => check.ok),
      next_action: buildNextAction(checks),
      checks,
      user: {
        id: user.id,
        full_name: user.full_name,
        status: user.status,
        telegram_chat_id: user.telegram_chat_id,
        telegram_username: user.telegram_username,
        uses_test_telegram: usesTestTelegram,
      },
      business_profile: businessProfile,
      product,
      existing_mission: existingMission,
      urls: {
        debug_user: `${url.origin}/api/admin/debug-user?user_id=${encodeURIComponent(userId)}`,
        test_send_mission: `${url.origin}/api/admin/test-send-mission?user_id=${encodeURIComponent(userId)}`,
        bootstrap_dummy_user: `${url.origin}/api/admin/bootstrap-dummy-user?user_id=${encodeURIComponent(userId)}`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to debug mission send readiness",
      },
      { status: 500 }
    );
  }
}
