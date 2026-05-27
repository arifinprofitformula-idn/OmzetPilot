export async function GET() {
  return Response.json({
    ok: true,
    service: "omzetpilot-mvp",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
