import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { type MissionGenerationInput, type MissionGenerationItem } from "@/src/lib/missionTypes";

const missionItemSchema = z.object({
  target_description: z.string().trim().min(10).max(220),
  action_instruction: z.string().trim().min(20).max(320),
  script_text: z.string().trim().min(20).max(320),
  target_minimum: z.string().trim().min(5).max(120),
});

const missionResponseSchema = z.object({
  mission_items: z
    .array(
      z.discriminatedUnion("mission_type", [
        missionItemSchema.extend({
          mission_type: z.literal("follow_up"),
          mission_order: z.literal(1),
        }),
        missionItemSchema.extend({
          mission_type: z.literal("offer"),
          mission_order: z.literal(2),
        }),
        missionItemSchema.extend({
          mission_type: z.literal("content_traffic"),
          mission_order: z.literal(3),
        }),
      ])
    )
    .length(3),
});

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

function getPositiveIntEnv(name: string, fallbackValue: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${name} environment variable`);
  }

  return parsedValue;
}

function sanitizeValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function trimToLength(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function sanitizeInput(input: MissionGenerationInput, maxChars: number) {
  const context = {
    mission_date: sanitizeValue(input.missionDate),
    user_name: sanitizeValue(input.userFullName),
    business_name: sanitizeValue(input.businessName),
    business_segment: sanitizeValue(input.businessSegment),
    target_customer: sanitizeValue(input.targetCustomer),
    product_name: sanitizeValue(input.productName),
    product_description: sanitizeValue(input.productDescription),
    product_price: sanitizeValue(input.productPrice),
    current_offer: sanitizeValue(input.currentOffer),
    main_sales_channel: sanitizeValue(input.mainSalesChannel),
    main_sales_problem: sanitizeValue(input.mainSalesProblem),
    has_customer_database: sanitizeValue(input.hasCustomerDatabase),
    contact_estimate: sanitizeValue(input.contactEstimate),
  };

  const serializedContext = trimToLength(
    JSON.stringify(context, null, 2),
    maxChars
  );

  return {
    context,
    serializedContext,
  };
}

function normalizeMissionItem(item: MissionGenerationItem): MissionGenerationItem {
  return {
    mission_type: item.mission_type,
    mission_order: item.mission_order,
    target_description: item.target_description.trim(),
    action_instruction: item.action_instruction.trim(),
    script_text: item.script_text.trim(),
    target_minimum: item.target_minimum.trim(),
  };
}

export async function generateMissionWithLLM(
  input: MissionGenerationInput
): Promise<MissionGenerationItem[]> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");
  const model = getRequiredEnv("OPENAI_MODEL");
  const maxInputChars = getPositiveIntEnv("MAX_LLM_INPUT_CHARS", 4000);
  const timeoutMs = getPositiveIntEnv("LLM_TIMEOUT_MS", 15000);
  const client = new OpenAI({ apiKey });
  const sanitizedInput = sanitizeInput(input, maxInputChars);

  try {
    const response = await client.responses.parse(
      {
        model,
        instructions:
          "Buat misi harian OmzetPilot dalam Bahasa Indonesia. Hasil harus spesifik, ringan, etis, cocok untuk seller pemula, siap eksekusi hari ini, dan tanpa unsur CRM.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Susun tepat 3 mission_items untuk konteks ini:\n${sanitizedInput.serializedContext}`,
              },
            ],
          },
        ],
        text: {
          format: zodTextFormat(missionResponseSchema, "daily_mission"),
        },
      },
      {
        signal: AbortSignal.timeout(timeoutMs),
      }
    );

    const parsedOutput = response.output_parsed;

    if (!parsedOutput) {
      throw new Error("OpenAI returned empty structured output");
    }

    const missionItems = parsedOutput.mission_items.map(normalizeMissionItem);

    if (missionItems.length !== 3) {
      throw new Error("OpenAI returned invalid mission item count");
    }

    return missionItems;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown OpenAI error";

    if (message.toLowerCase().includes("abort")) {
      throw new Error("OpenAI mission generation timed out");
    }

    throw new Error(`OpenAI mission generation failed: ${message}`);
  }
}
