import { accounts, accountTypes, emptyScript, generationSteps, models, seedProjects, skillPresets } from "./data.js";

const state = {
  accountId: "admin",
  view: "work",
  modelId: "gpt",
  skillId: "default",
  skillPrompt: skillPresets[0].prompt,
  projectName: "新客户脚本",
  sourceText: "",
  files: [],
  script: [],
  selectedPartId: "",
  versions: [],
  projects: structuredClone(seedProjects),
  selectedProjectId: seedProjects[0].id,
  projectQuery: "",
  hasGenerated: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const account = () => accounts.find(item => item.id === state.accountId) || accounts[0];
const accountType = (id = account().type) => accountTypes.find(item => item.id === id) || accountTypes[0];
const model = () => models.find(item => item.id === state.modelId) || models[0];
const skill = () => skillPresets.find(item => item.id === state.skillId) || skillPresets[0];
const canEdit = () => accountType().canEdit;
const canAdmin = () => accountType().canAdmin;
const uid = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const nodes = {
  appShell: $("#appShell"),
  loginScreen: $("#loginScreen"),
  toast: $("#toast"),
  modalLayer: $("#modalLayer"),
  modalTitle: $("#modalTitle"),
  modalKicker: $("#modalKicker"),
  modalBody: $("#modalBody"),
  modalActions: $("#modalActions")
};

function toast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => nodes.toast.classList.remove("show"), 2100);
}

function openModal({ kicker = "Action", title, body, actions = [] }) {
  nodes.modalKicker.textContent = kicker;
  nodes.modalTitle.textContent = title;
  nodes.modalBody.innerHTML = body;
  nodes.modalActions.innerHTML = actions.map(item => (
    `<button class="button ${item.style || ""}" data-modal-action="${item.id}">${item.label}</button>`
  )).join("");
  nodes.modalLayer.classList.remove("hidden");
  nodes.modalLayer.setAttribute("aria-hidden", "false");
}

function closeModal() {
  nodes.modalLayer.classList.add("hidden");
  nodes.modalLayer.setAttribute("aria-hidden", "true");
}

function guard(actionName) {
  if (canEdit()) return true;
  openModal({
    kicker: "Permission",
    title: "当前账户不可编辑",
    body: `<p>${accountType().name}账户只能查看内容，不能${actionName}。管理员可在后台调整账户类型。</p>`,
    actions: [{ id: "close", label: "知道了", style: "filled" }]
  });
  return false;
}

function renderAll() {
  renderLogin();
  renderChrome();
  renderWork();
  renderProjects();
  renderSettings();
  renderAdmin();
}

function renderLogin() {
  $("#loginAccount").innerHTML = accounts.map(item => (
    `<option value="${item.id}" ${item.id === state.accountId ? "selected" : ""}>${item.login}</option>`
  )).join("");
}

function renderChrome() {
  const type = accountType();
  $("#railAccountName").textContent = account().name;
  $("#railAccountType").textContent = type.name;
  $("#accountChip").textContent = type.name;
  $("#topRuleBtn").textContent = skill().name.replace("脚本规则", "规则");
  $$("[data-admin-only]").forEach(item => item.classList.toggle("hidden", !canAdmin()));
  $$("[data-nav]").forEach(item => item.classList.toggle("active", item.dataset.nav === state.view));
  const titles = {
    work: ["新建项目", "上传素材，配置规则，生成第一版脚本"],
    projects: ["项目库", "回看已有项目与版本"],
    settings: ["设置", "查看当前账户信息"],
    admin: ["后台", "管理账户类型与访问权限"]
  };
  $("#stageTitle").textContent = titles[state.view][0];
  $("#stageText").textContent = titles[state.view][1];
}

function renderWork() {
  $("#projectNameInput").value = state.projectName;
  $("#projectNameInput").readOnly = !canEdit();
  $("#sourceText").value = state.sourceText;
  $("#sourceText").readOnly = !canEdit();
  $("#modelSelect").innerHTML = models.map(item => (
    `<option value="${item.id}" ${item.id === state.modelId ? "selected" : ""}>${item.label} · ${item.note}</option>`
  )).join("");
  $("#fileList").innerHTML = state.files.length ? state.files.map(file => (
    `<span class="file-chip"><b>${file.name}</b><button data-remove-file="${file.id}" type="button">×</button></span>`
  )).join("") : `<span class="file-empty">还没有素材文件</span>`;
  $("#scriptState").textContent = state.hasGenerated ? "已生成" : "未生成";
  $("#scriptList").innerHTML = state.hasGenerated ? state.script.map(renderPart).join("") : renderBlankPaper();
  $("#versionBar").innerHTML = state.versions.length ? state.versions.map(v => (
    `<button data-version="${v.id}"><b>${v.label}</b><span>${v.time}</span></button>`
  )).join("") : `<span>保存后会出现在版本记录里</span>`;
  bindDrag();
}

function renderBlankPaper() {
  return `
    <div class="blank-paper">
      <strong>脚本会出现在这里</strong>
      <span>左侧放入素材后，点击生成。</span>
    </div>
  `;
}

function renderPart(part, index) {
  const active = part.id === state.selectedPartId ? "active" : "";
  const readonly = canEdit() ? "" : "readonly";
  return `
    <article class="script-part ${active}" data-part="${part.id}" draggable="${canEdit()}">
      <button class="drag-handle" type="button" aria-label="调整段落顺序"></button>
      <span class="part-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="part-body">
        <input class="part-label" data-part-label="${part.id}" value="${esc(part.label)}" ${readonly} />
        <input class="part-title" data-part-title="${part.id}" value="${esc(part.title)}" ${readonly} />
        <textarea class="part-content" data-part-content="${part.id}" ${readonly}>${esc(part.content)}</textarea>
      </div>
      <div class="part-actions">
        <button class="mini-action" data-part-action="improve" data-part-id="${part.id}">优化</button>
        <button class="mini-action" data-part-action="copy" data-part-id="${part.id}">复制</button>
        <button class="mini-action" data-part-action="delete" data-part-id="${part.id}">删除</button>
      </div>
    </article>
  `;
}

function renderProjects() {
  const query = state.projectQuery.trim().toLowerCase();
  const rows = state.projects.filter(item => !query || item.name.toLowerCase().includes(query));
  $("#projectList").innerHTML = rows.map(item => (
    `<button class="project-row ${item.id === state.selectedProjectId ? "active" : ""}" data-open-project="${item.id}">
      <span><b>${item.name}</b><em>${item.updated}</em></span>
      <small>${item.files.length} 个素材</small>
    </button>`
  )).join("") || `<div class="empty-small">没有匹配项目</div>`;
  renderProjectDetail();
}

function renderProjectDetail() {
  const item = state.projects.find(project => project.id === state.selectedProjectId) || state.projects[0];
  if (!item) {
    $("#projectDetail").innerHTML = `<p class="section-label">Detail</p><h2>暂无项目</h2>`;
    return;
  }
  $("#projectDetail").innerHTML = `
    <p class="section-label">Project</p>
    <h2>${item.name}</h2>
    <div class="meta-list">
      <span>更新时间 <b>${item.updated}</b></span>
      <span>素材文件 <b>${item.files.length}</b></span>
      <span>版本数量 <b>${item.script.length ? 1 : 0}</b></span>
    </div>
    <div class="material-preview">${esc(item.source || "暂无素材内容")}</div>
    <button class="button filled wide" data-load-project="${item.id}">打开项目</button>
  `;
}

function renderSettings() {
  $("#profilePanel").innerHTML = `
    <p class="section-label">Profile</p>
    <h2>账户</h2>
    <div class="profile-card">
      <span>登录账号</span><strong>${account().login}</strong>
      <span>账户类型</span><strong>${accountType().name}</strong>
      <p>${canEdit() ? "可创建、编辑、保存和导出脚本。" : "可查看项目和脚本内容。"}</p>
    </div>
  `;
}

function renderAdmin() {
  $("#adminPanel").innerHTML = `
    <p class="section-label">Admin</p>
    <h2>账户后台</h2>
    <div class="account-table">
      ${accounts.map(item => `
        <div class="account-row">
          <span><b>${item.name}</b><em>${item.login}</em></span>
          <select data-account-type="${item.id}">
            ${accountTypes.map(type => `<option value="${type.id}" ${item.type === type.id ? "selected" : ""}>${type.name}</option>`).join("")}
          </select>
          <button class="button small" data-reset-password="${item.id}" type="button">重置密码</button>
        </div>
      `).join("")}
    </div>
  `;
}

function setView(view) {
  if (view === "admin" && !canAdmin()) return;
  state.view = view;
  $$(".view").forEach(item => item.classList.toggle("active", item.id === `${view}View`));
  renderChrome();
}

function buildScript() {
  const base = structuredClone(emptyScript);
  const source = state.sourceText.trim() || state.files.map(file => file.content).join(" ");
  const lead = source.replace(/\s+/g, " ").slice(0, 82);
  base[0].content = `开场直接落在具体处境：${lead || "客户素材里的主要矛盾"}。让观众先看见人物遇到的麻烦。`;
  base[1].content = "人物继续用旧办法处理，事情没有立刻好转，节奏里保留一点误会和反差。";
  base[2].content = `${skill().name}介入：产品能力通过一个清楚动作出现，解决问题而不是解释功能。`;
  base[3].content = "结尾用一句短句收住，让客户能快速判断是否符合品牌语气。";
  return base.map(item => ({ ...item, id: uid("part") }));
}

async function generateScript() {
  if (!guard("生成脚本")) return;
  if (!state.sourceText.trim() && !state.files.length) {
    openModal({
      kicker: "Material",
      title: "先放入素材",
      body: `<p>可以上传文件，也可以直接粘贴客户 brief。</p>`,
      actions: [{ id: "open-upload", label: "上传素材", style: "filled" }, { id: "close", label: "取消" }]
    });
    return;
  }
  $("#scriptList").innerHTML = renderProgress();
  await stepProgress();
  state.script = buildScript();
  state.hasGenerated = true;
  state.selectedPartId = state.script[0].id;
  renderWork();
  toast("脚本已生成");
}

function renderProgress() {
  return `<div class="progress-list">${generationSteps.map(step => `<span>${step}<b>等待</b></span>`).join("")}</div>`;
}

async function stepProgress() {
  for (const step of $$(".progress-list span")) {
    await new Promise(resolve => setTimeout(resolve, 180));
    step.classList.add("done");
    step.querySelector("b").textContent = "完成";
  }
}

function openRuleModal() {
  openModal({
    kicker: "Skill",
    title: "脚本规则",
    body: `
      <label class="modal-field">规则预设<select id="modalSkillSelect">
        ${skillPresets.map(item => `<option value="${item.id}" ${item.id === state.skillId ? "selected" : ""}>${item.name}</option>`).join("")}
      </select></label>
      <label class="modal-field">Prompt<textarea id="modalSkillPrompt">${esc(state.skillPrompt)}</textarea></label>
    `,
    actions: [{ id: "save-skill", label: "保存规则", style: "filled" }, { id: "close", label: "取消" }]
  });
}

function openUploadModal() {
  if (!guard("上传素材")) return;
  openModal({
    kicker: "Upload",
    title: "添加素材",
    body: `
      <label class="modal-field">文件名<input id="uploadName" value="客户 brief.txt" /></label>
      <label class="modal-field">内容<textarea id="uploadContent">客户希望脚本有清晰开场、轻松冲突和自然卖点，不要写成说明书。</textarea></label>
    `,
    actions: [{ id: "confirm-upload", label: "加入项目", style: "filled" }, { id: "close", label: "取消" }]
  });
}

function openTuneModal() {
  if (!state.hasGenerated) {
    openRuleModal();
    return;
  }
  openModal({
    kicker: "Tune",
    title: "脚本调校",
    body: `
      <div class="tune-grid">
        <button data-tune-action="shorter">更短</button>
        <button data-tune-action="warmer">更有人味</button>
        <button data-tune-action="sharper">卖点更明确</button>
      </div>
      <label class="modal-field">补充要求<textarea id="tuneText">保留轻松感，减少解释，把产品动作写得更具体。</textarea></label>
    `,
    actions: [{ id: "apply-tune", label: "应用调校", style: "filled" }, { id: "close", label: "取消" }]
  });
}

function confirmUpload() {
  const name = $("#uploadName")?.value.trim() || "客户素材.txt";
  const content = $("#uploadContent")?.value.trim() || "";
  state.files.push({ id: uid("file"), name, content });
  if (!state.sourceText.trim() && content) state.sourceText = content;
  closeModal();
  renderWork();
  toast("素材已加入项目");
}

function saveSkill() {
  const selected = $("#modalSkillSelect")?.value || state.skillId;
  state.skillId = selected;
  state.skillPrompt = $("#modalSkillPrompt")?.value.trim() || skill().prompt;
  closeModal();
  renderChrome();
  toast("规则已更新");
}

function saveProject() {
  if (!guard("保存项目")) return;
  if (!state.hasGenerated) {
    toast("先生成脚本");
    return;
  }
  const project = {
    id: uid("project"),
    name: state.projectName || "未命名项目",
    updated: "刚刚",
    files: state.files.map(file => file.name),
    source: state.sourceText,
    script: structuredClone(state.script)
  };
  state.projects.unshift(project);
  state.selectedProjectId = project.id;
  state.versions.unshift({
    id: uid("version"),
    label: `V${state.versions.length + 1}`,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    script: structuredClone(state.script)
  });
  renderAll();
  toast("已保存");
}

function openExportModal() {
  if (!state.hasGenerated) {
    toast("先生成脚本");
    return;
  }
  openModal({
    kicker: "Export",
    title: "导出脚本",
    body: `<div class="export-box"><b>${esc(state.projectName)}</b><span>${state.script.length} 个段落</span></div>`,
    actions: [{ id: "download-doc", label: "Word", style: "filled" }, { id: "download-pdf", label: "PDF" }, { id: "close", label: "完成" }]
  });
}

function scriptText() {
  return state.script.map((part, i) => `${i + 1}. ${part.label}｜${part.title}\n${part.content}`).join("\n\n");
}

function downloadFile(kind) {
  const blob = new Blob([scriptText()], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.projectName || "脚本"}.${kind === "doc" ? "doc" : "txt"}`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("文件已生成");
}

function improvePart(id = state.selectedPartId, extra = "把人物反应写具体，减少解释。") {
  if (!guard("调校脚本")) return;
  state.script = state.script.map(part => part.id === id ? { ...part, content: `${part.content}\n\n调校：${extra}` } : part);
  renderWork();
  toast("已调校");
}

function copyPart(id) {
  if (!guard("复制段落")) return;
  const index = state.script.findIndex(part => part.id === id);
  if (index < 0) return;
  state.script.splice(index + 1, 0, { ...state.script[index], id: uid("part"), title: `${state.script[index].title}副本` });
  renderWork();
}

function deletePart(id) {
  if (!guard("删除段落")) return;
  if (state.script.length <= 1) return toast("至少保留一个段落");
  state.script = state.script.filter(part => part.id !== id);
  state.selectedPartId = state.script[0].id;
  renderWork();
}

function resetProject() {
  if (!guard("清空项目")) return;
  state.projectName = "新客户脚本";
  state.sourceText = "";
  state.files = [];
  state.script = [];
  state.versions = [];
  state.hasGenerated = false;
  renderAll();
}

function loadProject(id) {
  const item = state.projects.find(project => project.id === id);
  if (!item) return;
  state.projectName = item.name;
  state.sourceText = item.source;
  state.files = item.files.map(name => ({ id: uid("file"), name, content: "" }));
  state.script = structuredClone(item.script);
  state.hasGenerated = !!item.script.length;
  state.selectedPartId = state.script[0]?.id || "";
  setView("work");
  renderAll();
}

function setAccountType(accountId, type) {
  const item = accounts.find(account => account.id === accountId);
  if (!item) return;
  item.type = type;
  renderAll();
  toast("账户类型已更新");
}

function resetPassword(accountId) {
  const item = accounts.find(account => account.id === accountId);
  openModal({
    kicker: "Password",
    title: `${item.name} 密码已重置`,
    body: `<div class="password-box">tmp-${Math.random().toString(36).slice(2, 8)}</div>`,
    actions: [{ id: "close", label: "完成", style: "filled" }]
  });
}

function bindDrag() {
  if (!canEdit()) return;
  $$(".script-part").forEach(part => {
    part.addEventListener("dragstart", () => part.classList.add("dragging"));
    part.addEventListener("dragend", () => { part.classList.remove("dragging"); syncOrder(); });
    part.addEventListener("dragover", event => {
      event.preventDefault();
      const dragging = $(".script-part.dragging");
      if (!dragging || dragging === part) return;
      part.parentNode.insertBefore(dragging, event.offsetY > part.offsetHeight / 2 ? part.nextSibling : part);
    });
  });
}

function syncOrder() {
  const ids = $$(".script-part").map(part => part.dataset.part);
  state.script = ids.map(id => state.script.find(part => part.id === id)).filter(Boolean);
  renderWork();
}

function handleClick(event) {
  const target = event.target.closest("button, .script-part");
  if (!target) return;
  if (target.dataset.nav) setView(target.dataset.nav);
  if (target.id === "topRuleBtn" || target.id === "ruleButton") openRuleModal();
  if (target.id === "uploadMaterialBtn") openUploadModal();
  if (target.id === "generateBtn") generateScript();
  if (target.id === "saveScriptBtn") saveProject();
  if (target.id === "exportBtn") openExportModal();
  if (target.id === "tuneBtn") openTuneModal();
  if (target.id === "resetProjectBtn") resetProject();
  if (target.id === "newProjectBtn") {
    if (!guard("新建项目")) return;
    resetProject();
    setView("work");
  }
  if (target.dataset.tuneAction) {
    const copy = {
      shorter: "压缩成更短版本，减少旁白。",
      warmer: "让人物反应更有人味，语气轻一点。",
      sharper: "把卖点写得更明确，动作更具体。"
    }[target.dataset.tuneAction];
    const field = $("#tuneText");
    if (field) field.value = copy;
  }
  if (target.dataset.version) {
    const version = state.versions.find(item => item.id === target.dataset.version);
    if (version) {
      state.script = structuredClone(version.script);
      state.hasGenerated = true;
      state.selectedPartId = state.script[0]?.id || "";
      renderWork();
      toast("版本已恢复");
    }
  }
  if (target.dataset.removeFile && guard("移除素材")) {
    state.files = state.files.filter(file => file.id !== target.dataset.removeFile);
    renderWork();
  }
  if (target.dataset.part) {
    state.selectedPartId = target.dataset.part;
    $$(".script-part").forEach(item => item.classList.toggle("active", item === target));
  }
  if (target.dataset.partAction === "improve") improvePart(target.dataset.partId);
  if (target.dataset.partAction === "copy") copyPart(target.dataset.partId);
  if (target.dataset.partAction === "delete") deletePart(target.dataset.partId);
  if (target.dataset.openProject) {
    state.selectedProjectId = target.dataset.openProject;
    renderProjects();
  }
  if (target.dataset.loadProject) loadProject(target.dataset.loadProject);
  if (target.dataset.resetPassword) resetPassword(target.dataset.resetPassword);
}

function handleInput(event) {
  const target = event.target;
  if (target.id === "projectNameInput") state.projectName = target.value;
  if (target.id === "sourceText") state.sourceText = target.value;
  if (target.id === "projectSearch") {
    state.projectQuery = target.value;
    renderProjects();
  }
  if (target.dataset.partLabel) updatePart(target.dataset.partLabel, { label: target.value });
  if (target.dataset.partTitle) updatePart(target.dataset.partTitle, { title: target.value });
  if (target.dataset.partContent) updatePart(target.dataset.partContent, { content: target.value });
}

function updatePart(id, patch) {
  state.script = state.script.map(part => part.id === id ? { ...part, ...patch } : part);
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "loginAccount") state.accountId = target.value;
  if (target.id === "modelSelect") state.modelId = target.value;
  if (target.dataset.accountType) setAccountType(target.dataset.accountType, target.value);
}

function handleModalAction(event) {
  const action = event.target.closest("[data-modal-action]")?.dataset.modalAction;
  if (!action) return;
  if (action === "close") closeModal();
  if (action === "open-upload") { closeModal(); openUploadModal(); }
  if (action === "confirm-upload") confirmUpload();
  if (action === "save-skill") saveSkill();
  if (action === "apply-tune") {
    improvePart(state.selectedPartId, $("#tuneText")?.value.trim() || "按当前要求微调。");
    closeModal();
  }
  if (action === "download-doc") downloadFile("doc");
  if (action === "download-pdf") downloadFile("pdf");
}

function bindEvents() {
  $("#loginForm").addEventListener("submit", event => {
    event.preventDefault();
    nodes.loginScreen.classList.add("hidden");
    nodes.appShell.classList.remove("hidden");
    window.scrollTo({ top: 0, left: 0 });
    renderAll();
  });
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  nodes.modalActions.addEventListener("click", handleModalAction);
  $("#modalClose").addEventListener("click", closeModal);
  nodes.modalLayer.addEventListener("click", event => { if (event.target === nodes.modalLayer) closeModal(); });
  $$("[data-theme]").forEach(button => button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.theme;
    $$("[data-theme]").forEach(item => item.classList.toggle("active", item === button));
  }));
}

renderAll();
bindEvents();
