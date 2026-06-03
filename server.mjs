import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = join(here, "src");
const requestedPort = Number(process.env.PORT || 4317);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const generatedShots = [
  ["01", "酒楼外，两名武侠听到优惠券开抢，气氛突然紧张。", "全景", "固定", "3s"],
  ["02", "镜头切近，二人同时看向手机，券价低到离谱。", "近景", "推近", "4s"],
  ["03", "两人拔剑相向，为了最后一张券开始交手。", "中景", "横移", "5s"],
  ["04", "剑锋掠过桌面，优惠券弹到半空，形成争夺焦点。", "特写", "慢推", "4s"],
  ["05", "胜者抢到券，身后出现配送设备稳稳送达。", "中景", "后拉", "6s"]
].map(([id, image, shot, move, time]) => ({
  id,
  image,
  shot,
  move,
  time,
  props: id === "05" ? "配送设备、手机、优惠券页面" : "手机、优惠券、武侠服装",
  keywords: "martial artists, discount coupon, cinematic restaurant interior, dynamic camera movement"
}));

function json(response, payload, status = 200) {
  response.writeHead(status, { "Content-Type": mime[".json"] });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/generate" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)) || "{}");
    return json(response, {
      ok: true,
      model: body.model || "GPT",
      generatedAt: new Date().toISOString(),
      shots: generatedShots
    });
  }

  if (pathname === "/api/save" && request.method === "POST") {
    return json(response, {
      ok: true,
      version: "V1 客户确认版",
      savedAt: new Date().toISOString()
    });
  }

  return json(response, { ok: false, message: "Unknown API route" }, 404);
}

async function handleStatic(request, response, pathname) {
  const target = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(target).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicRoot, safePath);

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mime[extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    const fallback = await readFile(join(publicRoot, "index.html"));
    response.writeHead(200, { "Content-Type": mime[".html"] });
    response.end(fallback);
  }
}

function createApp(port) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }
    await handleStatic(request, response, url.pathname);
  });

  server.on("error", error => {
    if (error.code === "EADDRINUSE" && port < requestedPort + 20) {
      createApp(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`ShotForge prototype running at http://127.0.0.1:${port}`);
  });
}

createApp(requestedPort);
