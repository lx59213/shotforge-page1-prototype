export const accounts = [
  {
    id: "admin",
    name: "管理员",
    login: "admin.demo",
    permission: "admin",
    description: "可生成、编辑、保存、导出，并管理其他账号。"
  },
  {
    id: "editor",
    name: "正常使用账号",
    login: "editor.demo",
    permission: "write",
    description: "可生成、编辑、保存、导出项目脚本。"
  },
  {
    id: "reader",
    name: "只读账号",
    login: "reader.demo",
    permission: "read",
    description: "只可查看项目资料和脚本文档，不能改动内容。"
  }
];

export const models = [
  { id: "gpt", label: "GPT", note: "结构稳定" },
  { id: "gemini", label: "Gemini", note: "表达自然" },
  { id: "glm", label: "智谱 GLM", note: "中文友好" },
  { id: "doubao", label: "豆包", note: "响应较快" },
  { id: "claude", label: "Claude", note: "长材料稳" }
];

export const exampleMaterials = [
  {
    label: "办公室陪伴",
    text: "客户想做一条 60 秒轻喜剧广告：深夜办公室里，一个加班的人又累又嘴硬，智能设备用几次很轻的提醒把他从烦躁里拉回来。最后他发现设备不是在打扰，而是在帮他把工作节奏稳住。"
  },
  {
    label: "酒店急送",
    text: "客户描述：台风天，酒店住客临时需要生活用品，前台忙不过来。希望脚本既有紧张感，也要表现服务稳定、响应快、送达靠谱。"
  },
  {
    label: "门店促销",
    text: "客户只给了一句话：一张优惠券把冷清小店重新带热，老板从怀疑到惊喜，结尾要有年轻人愿意分享的幽默感。"
  }
];

export const generationSteps = [
  "读取客户素材",
  "提炼核心卖点",
  "整理脚本结构",
  "补齐口播与动作",
  "生成可编辑脚本文档"
];

export const projects = [
  {
    id: "client-short-a",
    name: "客户短片 A",
    owner: "全员",
    updated: "今天 18:20",
    materials: [
      {
        id: "brief-office",
        type: "客户素材",
        title: "办公室陪伴原始描述",
        scope: "全员",
        text: exampleMaterials[0].text
      },
      {
        id: "tone-guide",
        type: "参考文件",
        title: "品牌语气说明",
        scope: "全员",
        text: "语气克制、轻松、有一点点人情味。避免夸张喊口号，重点是把产品能力放进自然的工作场景。"
      },
      {
        id: "history-script",
        type: "历史脚本",
        title: "上一版脚本节奏",
        scope: "管理员 / 正常使用",
        text: "开场先建立工作压力，再出现轻微误会，最后用一个反差动作把卖点落住。"
      }
    ]
  },
  {
    id: "hotel-service-b",
    name: "酒店服务 B",
    owner: "正常使用",
    updated: "昨天 21:05",
    materials: [
      {
        id: "brief-hotel",
        type: "客户素材",
        title: "台风天急送需求",
        scope: "全员",
        text: exampleMaterials[1].text
      },
      {
        id: "service-notes",
        type: "参考文件",
        title: "服务稳定性卖点",
        scope: "管理员 / 正常使用",
        text: "重点表现响应及时、路径清晰、交付动作稳，不要写成硬广说明书。"
      }
    ]
  },
  {
    id: "store-campaign-c",
    name: "门店促销 C",
    owner: "管理员",
    updated: "3 天前",
    materials: [
      {
        id: "brief-store",
        type: "客户素材",
        title: "小店拉新一句话",
        scope: "全员",
        text: exampleMaterials[2].text
      }
    ]
  }
];

export const defaultScript = [
  {
    id: "part-1",
    label: "开场钩子",
    title: "深夜办公室的硬撑",
    content: "夜里，办公室只剩一个人。他盯着屏幕说“马上就好”，手边的咖啡已经凉了，桌面消息还在不断弹出。"
  },
  {
    id: "part-2",
    label: "冲突建立",
    title: "提醒被误会成打扰",
    content: "智能设备轻轻亮起，提醒他喝水、休息、检查清单。他皱眉按掉提示，嘴上说“不用管我”，却又马上找不到刚才的文件。"
  },
  {
    id: "part-3",
    label: "卖点转折",
    title: "真正被稳住的是节奏",
    content: "设备把待办按优先级排好，顺手调暗灯光、保留关键提醒。他终于发现，自己不是被打断，而是从混乱里被拉回了节奏。"
  },
  {
    id: "part-4",
    label: "结尾行动",
    title: "一句轻松的收束",
    content: "他喝下一口水，笑着把最后一项划掉。设备弹出一句：“今天也别把自己当机器。”画面停在安静下来的桌面。"
  }
];
