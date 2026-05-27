import "server-only";

import { getFallbackMission } from "@/src/lib/fallbackMission";
import { generateMissionWithLLM } from "@/src/lib/llm";
import { type MissionGenerationInput, type MissionGenerationItem } from "@/src/lib/missionTypes";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getTodayInJakarta } from "@/src/lib/time";
import type { Json, Tables } from "@/src/types/database.types";

const PROMPT_VERSION = "prompt_master_v1_1";
const MODEL_PROVIDER = "openai";

type MissionRow = Tables<"missions">;
type MissionItemRow = Tables<"mission_items">;
type UserRow = Tables<"users">;
type BusinessProfileRow = Tables<"business_profiles">;
type ProductRow = Tables<"products">;

type MissionGenerationResult = {
  mission: MissionRow;
  mission_items: MissionItemRow[];
};

type AiLogPayload = {
  userId: string;
  missionId: string | null;
  inputPayload: Json;
  outputPayload: Json;
  status: "success" | "failed";
  errorMessage: string | null;
};

function getOpenAIModelName() {
  return process.env.OPENAI_MODEL?.trim() || "unknown";
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

async function getMissionItems(missionId: string) {
  const { data, error } = await supabaseAdmin
    .from("mission_items")
    .select("*")
    .eq("mission_id", missionId)
    .order("mission_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch mission items: ${error.message}`);
  }

  return data;
}

async function getExistingMission(
  userId: string,
  missionDate: string
): Promise<MissionGenerationResult | null> {
  const { data: mission, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("user_id", userId)
    .eq("mission_date", missionDate)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch existing mission: ${error.message}`);
  }

  if (!mission) {
    return null;
  }

  const missionItems = await getMissionItems(mission.id);

  if (missionItems.length !== 3) {
    throw new Error("Existing mission does not have exactly 3 mission items");
  }

  return {
    mission,
    mission_items: missionItems,
  };
}

async function getUser(userId: string): Promise<UserRow> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  if (!data) {
    throw new Error("User not found");
  }

  return data;
}

async function getActiveBusinessProfile(
  userId: string
): Promise<BusinessProfileRow> {
  const { data, error } = await supabaseAdmin
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch business profile: ${error.message}`);
  }

  const businessProfile = data[0];

  if (!businessProfile) {
    throw new Error("Active business profile not found");
  }

  return businessProfile;
}

async function getPrimaryProduct(
  userId: string,
  businessProfileId: string
): Promise<ProductRow> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("business_profile_id", businessProfileId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  const product = data[0];

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

function buildMissionInput(
  missionDate: string,
  user: UserRow,
  businessProfile: BusinessProfileRow,
  product: ProductRow
): MissionGenerationInput {
  return {
    missionDate,
    userId: user.id,
    userFullName: user.full_name,
    businessName: businessProfile.business_name,
    businessSegment: businessProfile.business_segment,
    targetCustomer: businessProfile.target_customer,
    productName: product.product_name,
    productDescription: product.product_description,
    productPrice: product.price,
    currentOffer: businessProfile.current_offer,
    mainSalesChannel: businessProfile.main_sales_channel,
    mainSalesProblem: businessProfile.main_sales_problem,
    hasCustomerDatabase: businessProfile.has_customer_database,
    contactEstimate: businessProfile.contact_estimate,
  };
}

function buildAiLogInputPayload(input: MissionGenerationInput): Json {
  return {
    mission_date: input.missionDate,
    user_id: input.userId,
    business_name: input.businessName,
    business_segment: input.businessSegment,
    target_customer: input.targetCustomer,
    product_name: input.productName,
    product_description: input.productDescription,
    product_price: input.productPrice,
    current_offer: input.currentOffer,
    main_sales_channel: input.mainSalesChannel,
    main_sales_problem: input.mainSalesProblem,
    has_customer_database: input.hasCustomerDatabase,
    contact_estimate: input.contactEstimate,
  };
}

function buildAiLogOutputPayload(
  source: "llm" | "fallback",
  missionItems: MissionGenerationItem[]
): Json {
  return {
    source,
    mission_items: missionItems,
  };
}

async function insertAiLog(payload: AiLogPayload) {
  const inputText = JSON.stringify(payload.inputPayload);
  const outputText = JSON.stringify(payload.outputPayload);
  const { error } = await supabaseAdmin.from("ai_logs").insert({
    user_id: payload.userId,
    mission_id: payload.missionId,
    prompt_version: PROMPT_VERSION,
    model_provider: MODEL_PROVIDER,
    model_name: getOpenAIModelName(),
    input_payload: payload.inputPayload,
    output_payload: payload.outputPayload,
    token_input_estimate: estimateTokens(inputText),
    token_output_estimate: estimateTokens(outputText),
    estimated_cost: null,
    status: payload.status,
    error_message: payload.errorMessage,
  });

  if (error) {
    throw new Error(`Failed to insert ai_log: ${error.message}`);
  }
}

async function insertMission(
  userId: string,
  missionDate: string,
  businessProfileId: string,
  productId: string | null
) {
  const { data, error } = await supabaseAdmin
    .from("missions")
    .insert({
      user_id: userId,
      business_profile_id: businessProfileId,
      product_id: productId,
      mission_date: missionDate,
      delivery_channel: "telegram_bot",
      mission_status: "drafted",
      prompt_version: PROMPT_VERSION,
      created_by: "ai_system",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }

    throw new Error(`Failed to insert mission: ${error.message}`);
  }

  return data;
}

async function insertMissionItems(
  missionId: string,
  userId: string,
  missionItems: MissionGenerationItem[]
) {
  const { data, error } = await supabaseAdmin
    .from("mission_items")
    .insert(
      missionItems.map((item) => ({
        mission_id: missionId,
        user_id: userId,
        mission_type: item.mission_type,
        mission_order: item.mission_order,
        target_description: item.target_description,
        action_instruction: item.action_instruction,
        script_text: item.script_text,
        target_minimum: item.target_minimum,
      }))
    )
    .select()
    .order("mission_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to insert mission items: ${error.message}`);
  }

  if (data.length !== 3) {
    throw new Error("Inserted mission items count is invalid");
  }

  return data;
}

export async function generateMissionForUser(
  userId: string
): Promise<MissionGenerationResult> {
  const missionDate = getTodayInJakarta();
  const existingMission = await getExistingMission(userId, missionDate);

  if (existingMission) {
    return existingMission;
  }

  const user = await getUser(userId);
  const businessProfile = await getActiveBusinessProfile(userId);
  const product = await getPrimaryProduct(userId, businessProfile.id);
  const missionInput = buildMissionInput(
    missionDate,
    user,
    businessProfile,
    product
  );
  const aiLogInputPayload = buildAiLogInputPayload(missionInput);

  let generatedMissionItems: MissionGenerationItem[];
  let aiLogStatus: "success" | "failed" = "success";
  let aiLogErrorMessage: string | null = null;
  let missionSource: "llm" | "fallback" = "llm";

  try {
    generatedMissionItems = await generateMissionWithLLM(missionInput);
  } catch (error) {
    aiLogStatus = "failed";
    aiLogErrorMessage =
      error instanceof Error ? error.message : "Unknown LLM error";
    missionSource = "fallback";
    generatedMissionItems = getFallbackMission(missionInput);
  }

  const insertedMission = await insertMission(
    userId,
    missionDate,
    businessProfile.id,
    product.id
  );

  if (!insertedMission) {
    const concurrentMission = await getExistingMission(userId, missionDate);

    if (concurrentMission) {
      return concurrentMission;
    }

    throw new Error("Mission already exists for today");
  }

  let missionItems: MissionItemRow[];

  try {
    missionItems = await insertMissionItems(
      insertedMission.id,
      userId,
      generatedMissionItems
    );
  } catch (error) {
    try {
      await insertAiLog({
        userId,
        missionId: insertedMission.id,
        inputPayload: aiLogInputPayload,
        outputPayload: buildAiLogOutputPayload(
          missionSource,
          generatedMissionItems
        ),
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Mission generation failed",
      });
    } catch (logError) {
      const message =
        logError instanceof Error ? logError.message : "Unknown ai_log error";

      throw new Error(
        `Mission item insert failed, and ai_log insert also failed: ${message}`
      );
    }

    throw error;
  }

  await insertAiLog({
    userId,
    missionId: insertedMission.id,
    inputPayload: aiLogInputPayload,
    outputPayload: buildAiLogOutputPayload(
      missionSource,
      generatedMissionItems
    ),
    status: aiLogStatus,
    errorMessage: aiLogErrorMessage,
  });

  return {
    mission: insertedMission,
    mission_items: missionItems,
  };
}
