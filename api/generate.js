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

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "POST only" });
    return;
  }

  response.status(200).json({
    ok: true,
    model: request.body?.model || "GPT",
    generatedAt: new Date().toISOString(),
    script
  });
}
