const shots = [
  ["01", "酒楼外，两名武侠听到优惠券开抢，气氛突然紧张。", "全景", "固定", "3s"],
  ["02", "镜头切近，二人同时看向手机，券价低到离谱。", "近景", "推近", "4s"],
  ["03", "两人拔剑相向，为了最后一张券开始交手。", "中景", "横移", "5s"],
  ["04", "剑锋掠过桌面，优惠券弹到半空，形成争夺焦点。", "特写", "慢推", "4s"],
  ["05", "胜者抢到券，项目中的配送设备稳稳送达。", "中景", "后拉", "6s"]
].map(([id, image, shot, move, time]) => ({
  id,
  image,
  shot,
  move,
  time,
  props: "手机、优惠券、服装、项目设备",
  keywords: "martial artists, discount coupon, cinematic restaurant interior, dynamic camera movement"
}));

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "POST only" });
    return;
  }

  response.status(200).json({
    ok: true,
    model: request.body?.model || "GPT",
    generatedAt: new Date().toISOString(),
    shots
  });
}
