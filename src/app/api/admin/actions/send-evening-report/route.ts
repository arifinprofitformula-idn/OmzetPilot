import {
  getMissionsNeedingEveningReport,
  sendEveningReportRequestForMission,
} from "@/src/lib/reportReminder";

type RequestBody = {
  send?: boolean;
};

// TODO: Protect this route with real admin authentication before public beta.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;

    if (body.send === false) {
      return Response.json({
        ok: true,
        totalEligible: 0,
        sentCount: 0,
        failedCount: 0,
        failures: [],
      });
    }

    const eligibleMissions = await getMissionsNeedingEveningReport();
    const failures: Array<{ missionId: string; userId: string; error: string }> = [];
    let sentCount = 0;

    for (const eligibleMission of eligibleMissions) {
      try {
        const result = await sendEveningReportRequestForMission(eligibleMission);

        if (!result.skipped) {
          sentCount += 1;
        }
      } catch (error) {
        failures.push({
          missionId: eligibleMission.mission.id,
          userId: eligibleMission.user.id,
          error:
            error instanceof Error ? error.message : "Failed to send evening report",
        });
      }
    }

    return Response.json({
      ok: true,
      totalEligible: eligibleMissions.length,
      sentCount,
      failedCount: failures.length,
      failures,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send evening reports",
      },
      { status: 500 }
    );
  }
}
