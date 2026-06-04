import { accounts, accountTypes, emptyScript, generationSteps, materialGroups, materialItems, models, seedProjects, skillPresets } from "./data.js";
import { accountPopoverMarkup } from "./sidebar.js";
const supportedExt = ["md", "markdown", "txt", "docx", "pdf"];
const readableExt = ["md", "markdown", "txt"];
const groupCycle = ["样板", "进行中", "归档"];
const state = {
  accountId: "admin",
  view: "projects",
  railCollapsed: false,
  accountMenuOpen: false,
  modelId: "gpt",
  skillId: "default",
  skillQuery: "",
  projectFilter: "all",
  menu: "",
  skills: structuredClone(skillPresets),
  promptText: "",
  projectName: "新客户脚本",
  sourceText: "",
  files: [],
  script: [],
  selectedPartId: "",
  versions: [],
  projects: structuredClone(seedProjects),
  customModels: [],
  selectedProjectId: seedProjects[0]?.id || "",
  currentProjectId: "",
  hasGenerated: false,
  generating: false,
  apiKeys: Object.fromEntries(models.map(item => [item.id, item.id === "gpt" ? "sk-••••••••" : ""])),
  apiStatus: Object.fromEntries(models.map(item => [item.id, item.id === "gpt" ? "已配置" : "待配置"])),
  materialQuery: "",
  materialFilter: "all",
  materials: structuredClone(materialItems)
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const account = () => accounts.find(item => item.id === state.accountId) || accounts[0];
const accountType = (id = account().type) => accountTypes.find(item => item.id === id) || accountTypes[0];
const model = () => models.find(item => item.id === state.modelId) || models[0];
const apiModels = () => [...models, ...state.customModels];
const skill = () => state.skills.find(item => item.id === state.skillId) || state.skills[0];
const canEdit = () => accountType().canEdit;
const canAdmin = () => accountType().canAdmin;
const uid = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
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
  nodes.modalActions.innerHTML = actions.map(item => `<button class="button ${item.style || ""}" data-modal-action="${item.id}">${item.label}</button>`).join("");
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
  renderProjects();
  renderWork();
  renderScript();
  renderMaterials();
  renderSkills();
  renderSettings();
  renderAdmin();
}
function renderLogin() {
  $("#loginAccount").innerHTML = accounts.map(item => `<option value="${item.id}" ${item.id === state.accountId ? "selected" : ""}>${item.login}</option>`).join("");
  $("#loginUsernameMirror").value = account().login;
}
function renderChrome() {
  const type = accountType();
  nodes.appShell.classList.toggle("rail-collapsed", state.railCollapsed);
  $("#railToggle").setAttribute("aria-label", state.railCollapsed ? "展开侧边栏" : "收起侧边栏");
  $("#railAccountName").textContent = account().name;
  $("#railAccountType").textContent = type.name;
  $("#railAccountInitial").textContent = account().name.slice(0, 1);
  $("#accountPopover").innerHTML = accountPopoverMarkup({ user: account(), type, projectCount: state.projects.length, modelCount: apiModels().length });
  $("#accountPopover").classList.toggle("open", state.accountMenuOpen);
  $("#accountPopover").setAttribute("aria-hidden", String(!state.accountMenuOpen));
  $("#accountCard").classList.toggle("active", state.accountMenuOpen || state.view === "settings");
  $$("[data-admin-only]").forEach(item => item.classList.toggle("hidden", !canAdmin()));
  $$("[data-nav]").forEach(item => item.classList.toggle("active", item.dataset.nav === state.view));
  const titles = {
    projects: ["项目", "新建脚本或打开现有脚本"],
    materials: ["素材库", "项目资料、公共案例和个人参考"],
    work: ["新建脚本", "上传或粘贴客户素材"],
    script: ["脚本文档", "逐段编辑、调校、保存和导出"],
    skills: ["Skill", "管理脚本生成规则"],
    settings: ["账户", "个人资料与设置"],
    admin: ["后台", "账户权限与模型 API 配置"]
  };
  $("#stageTitle").textContent = titles[state.view][0];
  $("#stageText").textContent = titles[state.view][1];
}
function setView(view) {
  if (view === "admin" && !canAdmin()) return toast("当前账户没有后台权限");
  state.view = view;
  state.accountMenuOpen = false;
  state.menu = "";
  $$(".view").forEach(item => item.classList.toggle("active", item.id === `${view}View`));
  renderAll();
}
function projectRows() {
  return state.projects.filter(item => {
    if (state.projectFilter === "starred") return item.favorite;
    if (state.projectFilter.startsWith("group:")) return item.group === state.projectFilter.slice(6);
    return true;
  });
}
function renderProjects() {
  const groups = [...new Set(state.projects.map(item => item.group).filter(Boolean))];
  const filters = [{ id: "all", label: "全部" }, { id: "starred", label: "星标" }, ...groups.map(group => ({ id: `group:${group}`, label: group }))];
  $("#projectFilters").innerHTML = filters.map(item => `<button class="${state.projectFilter === item.id ? "active" : ""}" data-project-filter="${item.id}" type="button">${esc(item.label)}</button>`).join("");
  $("#projectCardGrid").innerHTML = `
    <article class="project-card create-card" data-start-script tabindex="0">
      <span class="card-plus"></span>
      <h3>新建脚本</h3>
      <p>从客户素材生成第一版可编辑脚本</p>
    </article>
    ${projectRows().map(renderProjectCard).join("") || `<div class="empty-small">当前分组还没有项目</div>`}
  `;
}
function renderProjectCard(project) {
  return `
    <article class="project-card ${project.id === state.selectedProjectId ? "active" : ""}">
      <button class="star-button ${project.favorite ? "active" : ""}" data-star-project="${project.id}" type="button" aria-label="星标 ${esc(project.name)}"></button>
      <div class="paper-spine"></div>
      <h3>${esc(project.name)}</h3>
      <p>${esc(project.source || "暂无素材摘要")}</p>
      <div class="card-meta">
        <span>${esc(project.updated)}</span>
        <span>${project.files.length} 个素材</span>
        <button data-cycle-group="${project.id}" type="button">${esc(project.group || "未分组")}</button>
      </div>
      <button class="button small" data-load-project="${project.id}" type="button">打开脚本</button>
    </article>
  `;
}
function renderWork() {
  $("#projectNameInput").value = state.projectName;
  $("#projectNameInput").readOnly = !canEdit();
  $("#sourceText").value = state.sourceText;
  $("#sourceText").readOnly = !canEdit();
  $("#promptInput").value = state.promptText;
  $("#promptInput").readOnly = !canEdit();
  $("#fileList").innerHTML = state.files.length ? state.files.map(file => `
    <span class="file-chip">
      <b>${esc(file.name)}</b><em>${file.ext.toUpperCase()} · ${formatSize(file.size)}</em>
      <button data-remove-file="${file.id}" type="button" aria-label="移除 ${esc(file.name)}">×</button>
    </span>
  `).join("") : `<span class="file-empty">还没有素材文件</span>`;
  renderComposerMenus();
  bindDragUpload();
}
function renderComposerMenus() {
  $("#addMenu").classList.toggle("hidden", state.menu !== "add");
  $("#skillPickMenu").classList.toggle("hidden", state.menu !== "skill");
  $("#modelMenu").classList.toggle("hidden", state.menu !== "model");
  $("#skillPickMenu").innerHTML = `
    <input id="skillQuickSearch" value="${esc(state.skillQuery)}" placeholder="搜索 Skill" />
    ${state.skills.filter(item => item.name.toLowerCase().includes(state.skillQuery.toLowerCase())).map(item => `
      <button class="${item.id === state.skillId ? "active" : ""}" data-pick-skill="${item.id}" type="button">
        <b>${esc(item.name)}</b><span>${esc(item.description)}</span>
      </button>
    `).join("") || `<div class="menu-empty">没有匹配 Skill</div>`}
  `;
  $("#modelMenuBtn").innerHTML = `<img src="${model().logo}" alt="${model().provider}" /><span>${esc(model().label)}</span>`;
  $("#modelMenu").innerHTML = models.map(item => `
    <button class="${item.id === state.modelId ? "active" : ""}" data-model-id="${item.id}" type="button">
      <img src="${item.logo}" alt="${item.provider}" /><span><b>${esc(item.label)}</b><em>${esc(item.version)}</em></span>
    </button>
  `).join("");
}
function renderMaterials() {
  const panel = $("#materialPanel");
  if (!panel) return;
  const q = state.materialQuery.trim().toLowerCase();
  const list = state.materials.filter(item => {
    const inQuery = !q || [item.title, item.group, item.type, item.visible, ...item.tags].join(" ").toLowerCase().includes(q);
    const inFilter = state.materialFilter === "all" || item.group === state.materialFilter;
    return inQuery && inFilter;
  });
  panel.innerHTML = `
    <div class="material-layout">
      <section class="material-sidebar">
        <div class="panel-head">
          <div><p class="section-label">Library</p><h2>素材库</h2></div>
          <button class="button small" data-upload-from-menu type="button">上传</button>
        </div>
        <input id="materialSearchInput" value="${esc(state.materialQuery)}" placeholder="搜索素材" />
        <div class="material-groups">
          <button class="${state.materialFilter === "all" ? "active" : ""}" data-material-filter="all" type="button">
            <span>全部素材</span><em>${state.materials.length}</em>
          </button>
          ${materialGroups.map(group => `
            <button class="${state.materialFilter === group.name ? "active" : ""}" data-material-filter="${esc(group.name)}" type="button">
              <span>${esc(group.name)}</span><em>${state.materials.filter(item => item.group === group.name).length || group.count}</em>
            </button>
          `).join("")}
        </div>
      </section>
      <section class="material-board">
        ${list.map(item => `
          <article class="material-item">
            <div><b>${esc(item.title)}</b><span>${esc(item.group)} · ${esc(item.type)}</span></div>
            <em>${esc(item.visible)}</em>
            <small>${item.tags.map(tag => `<i>${esc(tag)}</i>`).join("")}</small>
          </article>
        `).join("") || `<div class="empty-small">没有匹配素材</div>`}
      </section>
    </div>
  `;
}
function renderScript() {
  $("#scriptState").textContent = state.generating ? "生成中" : "可编辑稿";
  $("#scriptHeading").textContent = state.projectName || "脚本文档";
  $("#scriptList").innerHTML = state.generating
    ? renderProgress()
    : state.hasGenerated ? state.script.map(renderPart).join("") : renderBlankPaper();
  $("#versionBar").innerHTML = state.versions.length
    ? state.versions.map(v => `<button data-version="${v.id}"><b>${v.label}</b><span>${v.time}</span></button>`).join("")
    : `<span>保存后会出现在版本记录里</span>`;
  bindScriptDrag();
}
function renderProgress() {
  return `<div class="progress-list">${generationSteps.map(step => `<span>${step}<b>等待</b></span>`).join("")}</div>`;
}
function renderBlankPaper() {
  return `<div class="blank-paper"><strong>等待生成脚本</strong><span>先导入或粘贴客户素材。</span></div>`;
}
function renderPart(part, index) {
  const readonly = canEdit() ? "" : "readonly";
  return `
    <article class="script-part ${part.id === state.selectedPartId ? "active" : ""}" data-part="${part.id}" draggable="${canEdit()}">
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
function renderSkills() {
  const list = state.skills.filter(item => item.name.toLowerCase().includes(state.skillQuery.toLowerCase()));
  const current = skill();
  $("#skillPanel").innerHTML = `
    <div class="skill-layout">
      <section class="skill-list">
        <div class="panel-head"><div><p class="section-label">Skill</p><h2>技能库</h2></div><button class="button small" id="addSkillBtn" type="button">新增</button></div>
        <input id="skillSearchInput" value="${esc(state.skillQuery)}" placeholder="搜索 Skill" />
        <div class="skill-cards">${list.map(item => `
          <button class="${item.id === state.skillId ? "active" : ""}" data-select-skill="${item.id}" type="button">
            <b>${esc(item.name)}</b><span>${esc(item.description)}</span>
          </button>
        `).join("") || `<div class="empty-small">没有匹配 Skill</div>`}</div>
      </section>
      <section class="skill-editor">
        <label class="field-label">名称<input id="skillNameInput" value="${esc(current.name)}" /></label>
        <label class="field-label">说明<input id="skillDescInput" value="${esc(current.description)}" /></label>
        <label class="field-label">Skill 指令<textarea id="skillInstructionInput">${esc(current.instructions)}</textarea></label>
        <div class="editor-actions">
          <button class="button" id="deleteSkillBtn" type="button">删除</button>
          <button class="button filled" id="saveSkillBtn" type="button">保存 Skill</button>
        </div>
      </section>
    </div>
  `;
}
function renderSettings() {
  $("#profilePanel").innerHTML = `
    <p class="section-label">Profile</p>
    <h2>个人资料</h2>
    <div class="profile-card">
      <span>登录账号</span><strong>${account().login}</strong>
      <span>账户类型</span><strong>${accountType().name}</strong>
      <span>权限范围</span><strong>${canEdit() ? "可创建、编辑、保存和导出" : "只读查看"}</strong>
    </div>
    <div class="profile-card">
      <span>主题色</span>
      <div class="theme-picker settings-theme" aria-label="主题色">
        <button data-theme="paper" class="${document.body.dataset.theme === "paper" ? "active" : ""}" title="Paper Green"></button>
        <button data-theme="mineral" class="${document.body.dataset.theme === "mineral" ? "active" : ""}" title="Mineral Blue"></button>
        <button data-theme="ink" class="${document.body.dataset.theme === "ink" ? "active" : ""}" title="Ink Plum"></button>
        <button data-theme="sand" class="${document.body.dataset.theme === "sand" ? "active" : ""}" title="Muted Sand"></button>
      </div>
    </div>
  `;
}
function renderAdmin() {
  $("#adminPanel").innerHTML = canAdmin()
    ? renderAdminConsole()
    : `<p class="section-label">Admin</p><h2>无后台权限</h2><div class="empty-small">当前账户没有管理入口。</div>`;
}
function renderAdminConsole() {
  return `
    <section class="admin-console">
      <div class="admin-section">
        <div><p class="section-label">Accounts</p><h3>账户权限</h3></div>
        <div class="account-table">${accounts.map(item => `
          <div class="account-row">
            <span><b>${item.name}</b><em>${item.login}</em></span>
            <select data-account-type="${item.id}">
              ${accountTypes.map(type => `<option value="${type.id}" ${item.type === type.id ? "selected" : ""}>${type.name}</option>`).join("")}
            </select>
            <button class="button small" data-reset-password="${item.id}" type="button">重置密码</button>
          </div>
        `).join("")}</div>
      </div>
      <div class="admin-section">
        <div class="section-title-row"><div><p class="section-label">Models</p><h3>模型 API</h3></div><button class="button small" id="addModelBtn" type="button">添加模型</button></div>
        <div class="api-table">${apiModels().map(item => `
          <div class="api-row">
            <span class="api-icon ${state.apiKeys[item.id]?.trim() ? "ready" : ""}">
              ${state.apiKeys[item.id]?.trim() ? `<img src="${item.logo}" alt="${item.provider}" />` : esc(item.mark)}
            </span>
            <span><b>${item.label}</b><em>${item.version}</em></span>
            <input class="api-secret" data-api-key="${item.id}" type="text" autocomplete="off" value="${esc(state.apiKeys[item.id])}" placeholder="API Key" />
            <button class="button small" data-test-api="${item.id}" type="button">${state.apiStatus[item.id]}</button>
            <button class="button small" data-delete-api="${item.id}" type="button">删除</button>
          </div>
        `).join("")}</div>
      </div>
    </section>
  `;
}
function startNewScript() {
  if (!guard("新建脚本")) return;
  state.projectName = "新客户脚本";
  state.sourceText = "";
  state.files = [];
  state.script = [];
  state.versions = [];
  state.promptText = "";
  state.currentProjectId = "";
  state.hasGenerated = false;
  state.generating = false;
  setView("work");
}
function buildScript() {
  const base = structuredClone(emptyScript);
  const source = state.sourceText.trim() || state.files.map(file => file.content || file.name).join(" ");
  const lead = source.replace(/\s+/g, " ").slice(0, 96).replace(/[。！？.!?]+$/, "");
  const prompt = state.promptText.trim().replace(/[。！？.!?]+$/, "");
  base[0].content = `开场直接落在具体处境：${lead || "客户素材里的主要矛盾"}。让观众先看见人物遇到的麻烦。`;
  base[1].content = "人物继续用旧办法处理，事情没有立刻好转，节奏里保留一点误会和反差。";
  base[2].content = `${skill()?.name || "自定义方向"}介入：产品或服务通过一个清楚动作解决问题。${prompt ? `补充方向：${prompt}。` : ""}`;
  base[3].content = "结尾用一句短句收住，让客户能快速判断是否符合品牌语气。";
  return base.map(item => ({ ...item, id: uid("part") }));
}
async function generateScript() {
  if (!guard("生成脚本")) return;
  if (!state.sourceText.trim() && !state.files.length) {
    pulseUpload();
    toast("先上传文件或粘贴客户素材");
    return;
  }
  state.generating = true;
  setView("script");
  await stepProgress();
  state.script = buildScript();
  state.hasGenerated = true;
  state.generating = false;
  state.selectedPartId = state.script[0].id;
  renderAll();
  toast("脚本已生成");
}
async function stepProgress() {
  for (const step of $$(".progress-list span")) {
    await new Promise(resolve => setTimeout(resolve, 170));
    step.classList.add("done");
    step.querySelector("b").textContent = "完成";
  }
}
async function addFiles(fileList) {
  if (!guard("上传素材")) return;
  const next = [];
  for (const file of [...fileList]) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!supportedExt.includes(ext)) continue;
    const content = readableExt.includes(ext) ? await file.text() : "";
    next.push({ id: uid("file"), name: file.name, ext, size: file.size, content });
  }
  if (!next.length) return toast("格式暂不支持");
  state.files.push(...next);
  const readable = next.map(file => file.content).filter(Boolean).join("\n\n");
  if (!state.sourceText.trim() && readable) state.sourceText = readable;
  renderWork();
  toast(`已加入 ${next.length} 个素材`);
}
function saveProject() {
  if (!guard("保存项目")) return;
  if (!state.hasGenerated) return toast("先生成脚本");
  const materials = state.files.map(file => file.name);
  if (state.sourceText.trim()) materials.unshift("粘贴素材");
  const payload = {
    id: state.currentProjectId || uid("project"),
    name: state.projectName || "未命名项目",
    updated: "刚刚",
    favorite: false,
    group: "进行中",
    files: materials,
    source: state.sourceText,
    script: structuredClone(state.script)
  };
  const index = state.projects.findIndex(item => item.id === payload.id);
  if (index >= 0) state.projects[index] = { ...state.projects[index], ...payload };
  else state.projects.unshift(payload);
  state.currentProjectId = payload.id;
  state.selectedProjectId = payload.id;
  state.versions.unshift({ id: uid("version"), label: `V${state.versions.length + 1}`, time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), script: structuredClone(state.script) });
  renderAll();
  toast("已保存");
}
function useMaterialFromLibrary() {
  if (!guard("添加素材")) return;
  const item = state.materials[0];
  if (!item) return toast("素材库为空");
  state.files.push({ id: uid("file"), name: `${item.title}.${item.type.toLowerCase()}`, ext: item.type.toLowerCase(), size: 0, content: "" });
  if (!state.sourceText.trim()) state.sourceText = `${item.title}：${item.group}，${item.tags.join(" / ")}。`;
  state.menu = "";
  renderWork();
  toast("已从素材库加入 1 条素材");
}
function loadProject(id) {
  const item = state.projects.find(project => project.id === id);
  if (!item) return;
  state.currentProjectId = item.id;
  state.selectedProjectId = item.id;
  state.projectName = item.name;
  state.sourceText = item.source;
  state.files = item.files.map(name => ({ id: uid("file"), name, ext: name.includes(".") ? name.split(".").pop() : "txt", size: 0, content: "" }));
  state.script = structuredClone(item.script?.length ? item.script : emptyScript);
  state.hasGenerated = !!state.script.length;
  state.generating = false;
  state.selectedPartId = state.script[0]?.id || "";
  setView(state.hasGenerated ? "script" : "work");
}
function saveSkill() {
  if (!guard("保存 Skill")) return;
  state.skills = state.skills.map(item => item.id === state.skillId ? {
    ...item,
    name: $("#skillNameInput")?.value.trim() || item.name,
    description: $("#skillDescInput")?.value.trim() || item.description,
    instructions: $("#skillInstructionInput")?.value.trim() || item.instructions
  } : item);
  renderAll();
  toast("Skill 已保存");
}
function addSkill() {
  if (!guard("新增 Skill")) return;
  const id = uid("skill");
  state.skills.push({ id, name: "新 Skill", description: "自定义脚本规则", instructions: "描述这个 Skill 如何读取素材、提炼冲突、组织脚本和控制语气。" });
  state.skillId = id;
  renderAll();
}
function deleteSkill() {
  if (!guard("删除 Skill")) return;
  if (state.skills.length <= 1) return toast("至少保留一个 Skill");
  state.skills = state.skills.filter(item => item.id !== state.skillId);
  state.skillId = state.skills[0].id;
  renderAll();
  toast("Skill 已删除");
}
function openTuneModal() {
  if (!state.hasGenerated) return toast("先生成脚本");
  openModal({
    kicker: "Tune",
    title: "脚本调校",
    body: `<label class="modal-field">补充要求<textarea id="tuneText">保留轻松感，减少解释，把产品动作写得更具体。</textarea></label>`,
    actions: [{ id: "apply-tune", label: "应用调校", style: "filled" }, { id: "close", label: "取消" }]
  });
}
function openPartTuneModal(id) {
  if (!guard("优化段落")) return;
  state.selectedPartId = id;
  const part = state.script.find(item => item.id === id);
  openModal({
    kicker: "Tune",
    title: `优化：${part?.title || "当前段落"}`,
    body: `<label class="modal-field">修改意见<textarea id="partTuneText" placeholder="例如：把人物动作写具体一点，减少解释。">把人物动作写具体一点，减少解释。</textarea></label>`,
    actions: [{ id: "apply-part-tune", label: "发送", style: "filled" }, { id: "close", label: "取消" }]
  });
}
function openExportModal() {
  if (!state.hasGenerated) return toast("先生成脚本");
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
  link.download = `${state.projectName || "脚本"}.${kind === "doc" ? "doc" : "pdf"}`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("文件已生成");
}
function improvePart(id = state.selectedPartId, extra = "把人物反应写具体，减少解释。") {
  if (!guard("调校脚本")) return;
  state.script = state.script.map(part => part.id === id ? { ...part, content: `${part.content}\n\n调校：${extra}` } : part);
  renderScript();
  toast("段落已优化");
}
function copyPart(id) {
  if (!guard("复制段落")) return;
  const index = state.script.findIndex(part => part.id === id);
  if (index < 0) return;
  state.script.splice(index + 1, 0, { ...state.script[index], id: uid("part"), title: `${state.script[index].title}副本` });
  renderScript();
}
function deletePart(id) {
  if (!guard("删除段落")) return;
  if (state.script.length <= 1) return toast("至少保留一个段落");
  state.script = state.script.filter(part => part.id !== id);
  state.selectedPartId = state.script[0].id;
  renderScript();
}
function setAccountType(accountId, type) {
  const item = accounts.find(account => account.id === accountId);
  if (!item) return;
  const adminCount = accounts.filter(account => account.type === "admin").length;
  if (item.type === "admin" && type !== "admin" && adminCount <= 1) {
    renderAll();
    toast("至少保留一个管理员");
    return;
  }
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
function testApiKey(id) {
  state.apiStatus[id] = state.apiKeys[id]?.trim() ? "已连接" : "待配置";
  renderAdmin();
  toast(state.apiStatus[id] === "已连接" ? "模型连接通过" : "请先填写 API Key");
}
function addModelApi() {
  const item = { id: uid("api"), label: "自定义模型", provider: "Custom", version: "model-version", mark: "+" };
  state.customModels.push(item);
  state.apiKeys[item.id] = "";
  state.apiStatus[item.id] = "待配置";
  renderAdmin();
  toast("已添加模型 API");
}
function deleteApiKey(id) {
  if (state.customModels.some(item => item.id === id)) {
    state.customModels = state.customModels.filter(item => item.id !== id);
    delete state.apiKeys[id];
    delete state.apiStatus[id];
    renderAdmin();
    return toast("自定义模型已删除");
  }
  state.apiKeys[id] = "";
  state.apiStatus[id] = "待配置";
  renderAdmin();
  toast("模型配置已删除");
}
function cycleProjectGroup(id) {
  state.projects = state.projects.map(item => item.id === id ? { ...item, group: groupCycle[(groupCycle.indexOf(item.group) + 1) % groupCycle.length] } : item);
  renderProjects();
}
function bindScriptDrag() {
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
  renderScript();
}
function updatePart(id, patch) {
  state.script = state.script.map(part => part.id === id ? { ...part, ...patch } : part);
}
function pulseUpload() {
  $("#uploadZone").classList.add("attention");
  setTimeout(() => $("#uploadZone").classList.remove("attention"), 900);
}
function formatSize(size = 0) {
  if (!size) return "ready";
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
function handleClick(event) {
  if (!event.target.closest(".action-menu-wrap") && state.menu) {
    state.menu = "";
    renderComposerMenus();
  }
  if (!event.target.closest(".rail-system") && state.accountMenuOpen) {
    state.accountMenuOpen = false;
    renderChrome();
  }
  const target = event.target.closest("button, article[data-start-script], .script-part");
  if (!target) return;
  if (target.id === "homeBrand") setView("projects");
  if (target.dataset.nav) setView(target.dataset.nav);
  if (target.id === "railToggle") { state.railCollapsed = !state.railCollapsed; renderChrome(); }
  if (target.id === "accountCard") { state.accountMenuOpen = false; renderChrome(); }
  if (target.dataset.accountMenu === "settings") setView("settings");
  if (target.dataset.accountMenu === "logout") logout();
  if (target.id === "topNewProjectBtn" || target.dataset.startScript !== undefined) startNewScript();
  if (target.id === "resetProjectBtn") startNewScript();
  if (target.id === "addMenuBtn") { state.menu = state.menu === "add" ? "" : "add"; renderComposerMenus(); }
  if (target.dataset.openSkillPicker !== undefined) { state.menu = "skill"; renderComposerMenus(); setTimeout(() => $("#skillQuickSearch")?.focus(), 0); }
  if (target.dataset.uploadFromMenu !== undefined) $("#fileInput").click();
  if (target.dataset.useMaterialFromMenu !== undefined) useMaterialFromLibrary();
  if (target.dataset.pickSkill) { state.skillId = target.dataset.pickSkill; state.menu = ""; renderComposerMenus(); toast(`${skill().name} 已选中`); }
  if (target.id === "modelMenuBtn") { state.menu = state.menu === "model" ? "" : "model"; renderComposerMenus(); }
  if (target.dataset.modelId) { state.modelId = target.dataset.modelId; state.menu = ""; renderComposerMenus(); toast(`${model().label} 已选中`); }
  if (target.id === "generateBtn") generateScript();
  if (target.id === "saveScriptBtn") saveProject();
  if (target.id === "exportBtn") openExportModal();
  if (target.id === "tuneBtn") openTuneModal();
  if (target.id === "backToMaterialBtn") setView("work");
  if (target.dataset.projectFilter) { state.projectFilter = target.dataset.projectFilter; renderProjects(); }
  if (target.dataset.materialFilter) { state.materialFilter = target.dataset.materialFilter; renderMaterials(); }
  if (target.dataset.starProject) { state.projects = state.projects.map(item => item.id === target.dataset.starProject ? { ...item, favorite: !item.favorite } : item); renderProjects(); }
  if (target.dataset.cycleGroup) cycleProjectGroup(target.dataset.cycleGroup);
  if (target.dataset.loadProject) loadProject(target.dataset.loadProject);
  if (target.dataset.selectSkill) { state.skillId = target.dataset.selectSkill; renderSkills(); }
  if (target.id === "addSkillBtn") addSkill();
  if (target.id === "saveSkillBtn") saveSkill();
  if (target.id === "deleteSkillBtn") deleteSkill();
  if (target.dataset.removeFile && guard("移除素材")) { state.files = state.files.filter(file => file.id !== target.dataset.removeFile); renderWork(); }
  if (target.dataset.part) { state.selectedPartId = target.dataset.part; renderScript(); }
  if (target.dataset.partAction === "improve") openPartTuneModal(target.dataset.partId);
  if (target.dataset.partAction === "copy") copyPart(target.dataset.partId);
  if (target.dataset.partAction === "delete") deletePart(target.dataset.partId);
  if (target.dataset.resetPassword) resetPassword(target.dataset.resetPassword);
  if (target.id === "addModelBtn") addModelApi();
  if (target.dataset.testApi) testApiKey(target.dataset.testApi);
  if (target.dataset.deleteApi) deleteApiKey(target.dataset.deleteApi);
  renderChrome();
}
function logout() {
  nodes.appShell.classList.add("hidden");
  nodes.loginScreen.classList.remove("hidden");
  state.accountMenuOpen = false;
}
function handleInput(event) {
  const target = event.target;
  if (target.id === "projectNameInput") state.projectName = target.value;
  if (target.id === "sourceText") state.sourceText = target.value;
  if (target.id === "promptInput") state.promptText = target.value;
  if (target.id === "skillQuickSearch" || target.id === "skillSearchInput") {
    state.skillQuery = target.value;
    state.view === "skills" ? renderSkills() : renderComposerMenus();
  }
  if (target.id === "materialSearchInput") {
    state.materialQuery = target.value;
    renderMaterials();
  }
  if (target.dataset.apiKey) {
    state.apiKeys[target.dataset.apiKey] = target.value;
    state.apiStatus[target.dataset.apiKey] = target.value.trim() ? "可测试" : "待配置";
  }
  if (target.dataset.partLabel) updatePart(target.dataset.partLabel, { label: target.value });
  if (target.dataset.partTitle) updatePart(target.dataset.partTitle, { title: target.value });
  if (target.dataset.partContent) updatePart(target.dataset.partContent, { content: target.value });
}
function handleChange(event) {
  const target = event.target;
  if (target.id === "loginAccount") {
    state.accountId = target.value;
    renderLogin();
  }
  if (target.dataset.accountType) setAccountType(target.dataset.accountType, target.value);
}
function handleModalAction(event) {
  const action = event.target.closest("[data-modal-action]")?.dataset.modalAction;
  if (!action) return;
  if (action === "close") closeModal();
  if (action === "apply-tune") { improvePart(state.selectedPartId, $("#tuneText")?.value.trim() || "按当前要求微调。"); closeModal(); }
  if (action === "apply-part-tune") { improvePart(state.selectedPartId, $("#partTuneText")?.value.trim() || "按当前要求微调。"); closeModal(); }
  if (action === "download-doc") downloadFile("doc");
  if (action === "download-pdf") downloadFile("pdf");
}
function bindDragUpload() {
  const zone = $("#uploadZone");
  if (zone.dataset.bound) return;
  zone.dataset.bound = "1";
  zone.addEventListener("click", () => { if (canEdit()) $("#fileInput").click(); });
  zone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (canEdit()) $("#fileInput").click();
    }
  });
  zone.addEventListener("dragover", event => { event.preventDefault(); zone.classList.add("is-dragging"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
  zone.addEventListener("drop", event => {
    event.preventDefault();
    zone.classList.remove("is-dragging");
    addFiles(event.dataTransfer.files);
  });
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
  $("#fileInput").addEventListener("change", event => {
    addFiles(event.target.files);
    event.target.value = "";
  });
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-theme]");
    if (!button) return;
    document.body.dataset.theme = button.dataset.theme;
    renderSettings();
  });
}
renderAll();
bindEvents();
