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

const script = [
  {
    id: "part-api-1",
    label: "开场钩子",
    title: "先把人放进具体麻烦",
    content: "主角正在处理一件临时冒出来的麻烦事，语气嘴硬但动作已经乱了。观众先看见处境，再理解产品为什么有用。"
  },
  {
    id: "part-api-2",
    label: "冲突建立",
    title: "旧办法越用越乱",
    content: "他尝试按自己的经验解决问题，却不断被小状况打断。这里保留轻微幽默，让焦虑不变成沉重。"
  },
  {
    id: "part-api-3",
    label: "卖点转折",
    title: "产品能力自然出现",
    content: "产品用一个具体动作把混乱梳理清楚：提醒、整理、送达或确认。卖点不靠旁白硬讲，而是从人物反应里被看见。"
  },
  {
    id: "part-api-4",
    label: "结尾行动",
    title: "用一句话收住记忆点",
    content: "问题解决后，主角给出一个轻松反应。最后用一句短促行动句收束，方便客户确认和后续修改。"
  }
];

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
      script
    });
  }

  if (pathname === "/api/save" && request.method === "POST") {
    return json(response, {
      ok: true,
      version: "V1 脚本版本",
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
    console.log(`ScriptForge prototype running at http://127.0.0.1:${port}`);
  });
}

createApp(requestedPort);
