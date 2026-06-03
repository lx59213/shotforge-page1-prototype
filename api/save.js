export default function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "POST only" });
    return;
  }

  response.status(200).json({
    ok: true,
    version: "V1 客户确认版",
    savedAt: new Date().toISOString()
  });
}
