export const accountTypes = [
  { id: "admin", name: "管理员", canEdit: true, canAdmin: true },
  { id: "writer", name: "编剧", canEdit: true, canAdmin: false },
  { id: "client", name: "客户", canEdit: false, canAdmin: false }
];

export const accounts = [
  { id: "admin", login: "admin.demo", name: "管理员账号", type: "admin" },
  { id: "writer", login: "writer.demo", name: "编剧账号", type: "writer" },
  { id: "client", login: "client.demo", name: "客户账号", type: "client" }
];

export const models = [
  {
    id: "gpt",
    label: "GPT-5.2",
    provider: "OpenAI",
    version: "gpt-5.2",
    note: "结构稳定",
    logo: "./assets/openai.svg",
    mark: "AI"
  },
  {
    id: "gemini",
    label: "Gemini 3 Pro",
    provider: "Google",
    version: "gemini-3-pro-preview",
    note: "表达自然",
    logo: "./assets/gemini.svg",
    mark: "G"
  },
  {
    id: "claude",
    label: "Sonnet 4.6",
    provider: "Anthropic",
    version: "claude-sonnet-4-6",
    note: "长材料稳",
    logo: "./assets/anthropic.svg",
    mark: "C"
  },
  {
    id: "glm",
    label: "GLM-4.7",
    provider: "智谱",
    version: "glm-4.7",
    note: "中文友好",
    logo: "./assets/zhipu.svg",
    mark: "智"
  },
  {
    id: "doubao",
    label: "Seed 1.6",
    provider: "豆包",
    version: "doubao-seed-1-6",
    note: "响应快",
    logo: "./assets/doubao.svg",
    mark: "豆"
  }
];

export const skillPresets = [
  {
    id: "default",
    name: "默认拆解规则",
    description: "客户素材到可审脚本文档",
    instructions: "先提炼客户素材里的目标、人物、冲突、卖点和结尾动作；输出四到六段可直接编辑的广告脚本，不写空泛解释。"
  },
  {
    id: "viral",
    name: "传播短片节奏",
    description: "更偏反差和传播点",
    instructions: "优先制造反差、误会和记忆点；开场三秒给出明确冲突，中段让卖点自然出现，结尾保留可传播的轻巧句子。"
  },
  {
    id: "brand",
    name: "品牌质感版本",
    description: "更克制、更像客户可确认稿",
    instructions: "压低夸张情绪，突出服务稳定、动作可信和人物真实反应；语言简洁，避免喊口号。"
  }
];

export const generationSteps = ["读取素材", "提炼卖点", "套用规则", "生成脚本"];

export const materialGroups = [
  { id: "group-public", name: "公共案例", count: 12 },
  { id: "group-client", name: "客户资料", count: 3 },
  { id: "group-private", name: "个人参考", count: 5 }
];

export const materialItems = [
  {
    id: "mat-001",
    title: "轻喜剧广告 brief",
    group: "客户资料",
    type: "Markdown",
    updated: "刚刚",
    tags: ["brief", "轻喜剧"],
    visible: "编剧可见"
  },
  {
    id: "mat-002",
    title: "服务反转案例库",
    group: "公共案例",
    type: "PDF",
    updated: "昨天",
    tags: ["案例", "反转"],
    visible: "全员"
  },
  {
    id: "mat-003",
    title: "客户确认口径",
    group: "个人参考",
    type: "TXT",
    updated: "2 天前",
    tags: ["口径", "确认稿"],
    visible: "仅本人"
  }
];

export const seedProjects = [
  {
    id: "proj-001",
    name: "客户脚本样板",
    updated: "刚刚",
    favorite: true,
    group: "样板",
    files: ["客户 brief.txt", "品牌语气.pdf"],
    source: "客户想做一条 60 秒广告：一个人遇到临时状况，服务或设备用很轻的方式把事情稳住。整体要有轻松感，但不要变成硬广。",
    script: []
  }
];

export const emptyScript = [
  {
    id: "part-1",
    label: "开场",
    title: "把人物放进具体麻烦",
    content: "主角被一个临时状况打断，动作开始变乱，但还在嘴硬。"
  },
  {
    id: "part-2",
    label: "推进",
    title: "旧办法失效",
    content: "他尝试按经验处理，结果越处理越忙，问题被观众看得更清楚。"
  },
  {
    id: "part-3",
    label: "转折",
    title: "产品能力出现",
    content: "产品或服务用一个具体动作把混乱梳理好，卖点从人物反应里被看见。"
  },
  {
    id: "part-4",
    label: "收束",
    title: "留下记忆点",
    content: "主角给出一个轻松反应，用一句短促的话收住品牌记忆。"
  }
];
