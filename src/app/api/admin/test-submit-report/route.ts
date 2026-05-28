import { submitMissionReport } from "@/src/lib/report";

// Internal testing route only. Remove or protect before public beta.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const missionId = url.searchParams.get("mission_id");
  const telegramChatId = url.searchParams.get("telegram_chat_id");
  const reportCode = url.searchParams.get("report_code");

  if (!missionId || !telegramChatId || !reportCode) {
    return Response.json(
      {
        ok: false,
        error: "Missing mission_id, telegram_chat_id, or report_code query parameter",
      },
      { status: 400 }
    );
  }

  if (!["1", "2", "3", "4"].includes(reportCode)) {
    return Response.json(
      {
        ok: false,
        error: "report_code must be one of 1, 2, 3, or 4",
      },
      { status: 400 }
    );
  }

  const result = await submitMissionReport(
    missionId,
    telegramChatId,
    reportCode as "1" | "2" | "3" | "4"
  );

  return Response.json(result);
}
