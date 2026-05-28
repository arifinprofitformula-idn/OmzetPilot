import { verifyAdminSecret } from "@/src/lib/security";

export async function GET(request: Request) {
  if (!verifyAdminSecret(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shouldSend = searchParams.get("send") === "true";

  return Response.json({
    ok: true,
    send: shouldSend,
    message:
      "MVP placeholder route. Evening report broadcast flow is not implemented yet.",
  });
}
