import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

const DEFAULT_DUMMY_USER_ID = "7d9f6b5e-1f72-4d68-9f3f-6e4d2ab8c001";

async function ensureUser(userId: string) {
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, full_name, telegram_chat_id")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch dummy user: ${fetchError.message}`);
  }

  if (existingUser) {
    if (existingUser.telegram_chat_id?.startsWith("test:")) {
      return existingUser;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        telegram_chat_id: `test:${userId}`,
        telegram_username: "dummy_omzetpilot_tester",
        status: "active",
      })
      .eq("id", userId)
      .select("id, full_name, telegram_chat_id")
      .single();

    if (updateError) {
      throw new Error(`Failed to update dummy user: ${updateError.message}`);
    }

    return updatedUser;
  }

  const { data: insertedUser, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      id: userId,
      full_name: "Dummy Mission Tester",
      whatsapp_number: "6281111111111",
      telegram_username: "dummy_omzetpilot_tester",
      telegram_chat_id: `test:${userId}`,
      email: "dummy-mission-tester@example.com",
      status: "active",
      fit_score: "medium_fit",
      cohort_name: "alpha_batch_1",
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select("id, full_name, telegram_chat_id")
    .single();

  if (insertError) {
    throw new Error(`Failed to create dummy user: ${insertError.message}`);
  }

  return insertedUser;
}

async function ensureBusinessProfile(userId: string) {
  const { data: profiles, error: fetchError } = await supabaseAdmin
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) {
    throw new Error(`Failed to fetch dummy business profile: ${fetchError.message}`);
  }

  const existingProfile = profiles[0];

  if (existingProfile) {
    return existingProfile;
  }

  const { data: insertedProfile, error: insertError } = await supabaseAdmin
    .from("business_profiles")
    .insert({
      user_id: userId,
      business_name: "Toko Dummy OmzetPilot",
      business_segment: "digital_product",
      product_or_service_summary: "Template promosi dan materi jualan sederhana untuk UMKM.",
      target_customer: "Pemilik usaha kecil yang ingin jualan lebih konsisten.",
      main_sales_channel: "WhatsApp dan Telegram",
      main_sales_problem: "Sudah punya produk, tapi bingung follow up dan closing harian.",
      has_customer_database: "sedikit",
      contact_estimate: "6-20",
      current_offer: "Paket template closing Rp99.000",
      status: "active",
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to create dummy business profile: ${insertError.message}`);
  }

  return insertedProfile;
}

async function ensureProduct(userId: string, businessProfileId: string) {
  const { data: products, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .eq("business_profile_id", businessProfileId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (fetchError) {
    throw new Error(`Failed to fetch dummy product: ${fetchError.message}`);
  }

  const existingProduct = products[0];

  if (existingProduct) {
    return existingProduct;
  }

  const { data: insertedProduct, error: insertError } = await supabaseAdmin
    .from("products")
    .insert({
      user_id: userId,
      business_profile_id: businessProfileId,
      product_name: "Template Closing Dummy",
      product_description: "Template chat follow up dan closing siap pakai untuk testing misi.",
      price: 99000,
      availability_status: "ready",
      is_primary: true,
      notes: "Produk dummy untuk internal testing mission delivery.",
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to create dummy product: ${insertError.message}`);
  }

  return insertedProduct;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") || DEFAULT_DUMMY_USER_ID;

  try {
    const user = await ensureUser(userId);
    const businessProfile = await ensureBusinessProfile(userId);
    const product = await ensureProduct(userId, businessProfile.id);

    return Response.json({
      ok: true,
      mode: "dummy_bootstrap",
      user_id: user.id,
      business_profile_id: businessProfile.id,
      product_id: product.id,
      telegram_chat_id: user.telegram_chat_id,
      note: "Dummy user is ready. test:* chat ids simulate Telegram delivery for internal testing.",
      urls: {
        debug_user: `${url.origin}/api/admin/debug-user?user_id=${encodeURIComponent(user.id)}`,
        test_send_mission: `${url.origin}/api/admin/test-send-mission?user_id=${encodeURIComponent(user.id)}`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to bootstrap dummy user",
      },
      { status: 500 }
    );
  }
}
