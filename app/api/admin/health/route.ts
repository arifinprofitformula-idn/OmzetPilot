export async function GET() {
  return Response.json({
    ok: true,
    service: "omzetpilot-mvp-root-app-unused",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
