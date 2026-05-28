export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldSend = searchParams.get("send") === "true";

  return Response.json({
    ok: true,
    send: shouldSend,
    message:
      "MVP placeholder route. Evening report broadcast flow is not implemented yet.",
  });
}
