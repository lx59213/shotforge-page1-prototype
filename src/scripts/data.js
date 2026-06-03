export const models = [
  { id: "gpt", label: "GPT", note: "结构稳定" },
  { id: "gemini", label: "Gemini", note: "画面感强" },
  { id: "glm", label: "智谱 GLM", note: "中文友好" },
  { id: "doubao", label: "豆包", note: "速度快" },
  { id: "claude", label: "Claude", note: "长文本稳" }
];

export const examples = [
  { label: "武侠促销", text: "两个武侠因为优惠券太便宜打起来，抢到券的人获胜。" },
  { label: "办公室陪伴", text: "一个疲惫程序员在深夜加班，桌边的智能设备用便签提醒他喝水。" },
  { label: "酒店配送", text: "台风天，酒店客人急需生活用品，配送设备把物品送到房间门口。" }
];

export const generateSteps = [
  "理解客户 brief",
  "拆剧情节点",
  "拆镜头顺序",
  "补景别与运镜",
  "生成英文关键词"
];

export const fallbackShots = [
  {
    id: "01",
    image: "酒楼外，两名武侠听到优惠券开抢，气氛突然紧张。",
    shot: "全景",
    move: "固定",
    time: "3s",
    props: "酒楼门头、手机、武侠服装",
    keywords: "wide shot, martial artists outside restaurant, discount coupon alert"
  },
  {
    id: "02",
    image: "镜头切近，二人同时看向手机，券价低到离谱。",
    shot: "近景",
    move: "推近",
    time: "4s",
    props: "手机屏幕、优惠券页面",
    keywords: "close shot, two martial artists looking at phone, coupon price shock"
  },
  {
    id: "03",
    image: "两人拔剑相向，为了最后一张券开始交手。",
    shot: "中景",
    move: "横移",
    time: "5s",
    props: "长剑、桌椅、优惠券页面",
    keywords: "medium shot, sword fight, discount coupon, dynamic motion"
  },
  {
    id: "04",
    image: "剑锋掠过桌面，优惠券弹到半空，形成争夺焦点。",
    shot: "特写",
    move: "慢推",
    time: "4s",
    props: "长剑、优惠券、桌面",
    keywords: "extreme close up, coupon flying above table, sword motion"
  },
  {
    id: "05",
    image: "胜者抢到券，身后出现配送设备稳稳送达。",
    shot: "中景",
    move: "后拉",
    time: "6s",
    props: "配送设备、手机、外卖袋",
    keywords: "medium shot, delivery device arrives, victorious martial artist"
  }
];

export const libraries = [
  { name: "公共案例库", count: 126, visible: "全员", tags: "广告 / 短剧 / 餐饮", state: "已索引", roles: ["导演", "制片", "客户"] },
  { name: "客户项目资料", count: 38, visible: "导演、制片", tags: "客户资料 / 品牌规范", state: "项目可见", roles: ["导演", "制片"] },
  { name: "导演私有参考", count: 17, visible: "仅本人", tags: "镜头语言 / 风格图", state: "私有", roles: ["导演"] },
  { name: "报价与合同", count: 6, visible: "制片、管理员", tags: "商务 / 报价", state: "受限", roles: ["制片"] }
];
