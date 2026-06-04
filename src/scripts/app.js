import {
  accounts,
  defaultScript,
  exampleMaterials,
  generationSteps,
  models,
  projects as seedProjects
} from "./data.js";

const state = {
  accountId: "admin",
  view: "work",
  theme: "paper",
  modelId: "gpt",
  projectId: seedProjects[0].id,
  projects: structuredClone(seedProjects),
  script: structuredClone(defaultScript),
  selectedPartId: "part-1",
  versions: [],
  libraryFilter: "全部",
  libraryQuery: "",
  activeMaterialId: seedProjects[0].materials[0].id,
  sourceText: seedProjects[0].materials[0].text,
  hasGenerated: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

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

const account = () => accounts.find(item => item.id === state.accountId) || accounts[0];
const model = () => models.find(item => item.id === state.modelId) || models[0];
const project = () => state.projects.find(item => item.id === state.projectId) || state.projects[0];
const canWrite = () => account().permission !== "read";
const canAdmin = () => account().permission === "admin";
const textToId = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => nodes.toast.classList.remove("show"), 2200);
}

function openModal({ kicker = "Action", title, body, actions = [] }) {
  nodes.modalKicker.textContent = kicker;
  nodes.modalTitle.textContent = title;
  nodes.modalBody.innerHTML = body;
  nodes.modalActions.innerHTML = actions.map(action => (
    `<button class="button ${action.style || ""}" data-modal-action="${action.id}">${action.label}</button>`
  )).join("");
  nodes.modalLayer.classList.remove("hidden");
  nodes.modalLayer.setAttribute("aria-hidden", "false");
}

function closeModal() {
  nodes.modalLayer.classList.add("hidden");
  nodes.modalLayer.setAttribute("aria-hidden", "true");
  nodes.modalBody.innerHTML = "";
  nodes.modalActions.innerHTML = "";
}

function guardWrite(actionLabel) {
  if (canWrite()) return true;
  openModal({
    kicker: "Permission",
    title: "当前账号为只读",
    body: `<p>你可以查看项目资料和脚本文档，但不能${actionLabel}。管理员可在设置页把这个账号改为正常使用。</p>`,
    actions: [
      { id: "go-settings", label: "去设置页", style: "filled" },
      { id: "close", label: "我知道了" }
    ]
  });
  return false;
}

function updateChrome() {
  const currentAccount = account();
  const currentProject = project();
  $("#railAccountName").textContent = currentAccount.name;
  $("#railAccountPermission").textContent = permissionText(currentAccount.permission);
  $("#accountChip").textContent = currentAccount.name;
  $("#projectChip").textContent = currentProject.name;
  $("#stageText").textContent = {
    work: "页面一 / 客户素材转脚本",
    library: "项目资料 / 可选择当前项目",
    settings: "设置 / 账号权限"
  }[state.view];
}

const permissionText = permission => ({ admin: "管理员权限", write: "可正常使用", read: "只读查看" })[permission] || "只读查看";

function renderProjectSelect() {
  $("#projectSelect").innerHTML = state.projects.map(item => (
    `<option value="${item.id}" ${item.id === state.projectId ? "selected" : ""}>${item.name}</option>`
  )).join("");

  $("#projectTree").innerHTML = state.projects.map(item => {
    const count = item.materials.length;
    return `<button class="${item.id === state.projectId ? "active" : ""}" data-project="${item.id}">
      <span>${item.name}</span><em>${count} 项资料</em>
    </button>`;
  }).join("");
}

function renderControls() {
  $("#modelSelect").innerHTML = models.map(item => (
    `<option value="${item.id}" ${item.id === state.modelId ? "selected" : ""}>${item.label} · ${item.note}</option>`
  )).join("");
  $("#sourceText").value = state.sourceText;
  $("#exampleRow").innerHTML = exampleMaterials.map(item => (
    `<button type="button" data-example="${escapeHtml(item.text)}">${item.label}</button>`
  )).join("");
}

function renderScriptArea() {
  const generatedClass = state.hasGenerated ? "generated" : "";
  $("#scriptArea").innerHTML = `
    <section class="panel script-paper ${generatedClass}">
      <div class="script-head">
        <div>
          <p class="section-label ${state.hasGenerated ? "success" : ""}">
            ${state.hasGenerated ? "已生成 · 可编辑" : "Draft"}
          </p>
          <h2>${state.hasGenerated ? "脚本文档" : "等待生成脚本"}</h2>
        </div>
        <div class="compact-actions">
          <button class="button small" id="saveScriptBtn" type="button">保存脚本</button>
          <button class="button small" id="optimizePartBtn" type="button">优化选中段</button>
          <button class="button filled small" id="exportBtn" type="button">导出 Word/PDF</button>
        </div>
      </div>
      <div class="script-list" id="scriptList">
        ${state.hasGenerated ? state.script.map(renderScriptPart).join("") : renderEmptyScript()}
      </div>
      ${renderVersionBar()}
    </section>
    <aside class="panel tune-panel" id="tunePanel">${renderTunePanel()}</aside>
  `;
  bindDragEvents();
}

function renderEmptyScript() {
  return `
    <div class="empty-state">
      <span class="empty-icon"></span>
      <strong>素材会在这里变成脚本文档</strong>
      <p>先导入或粘贴客户素材，再选择模型生成。生成后可以直接改段落、调顺序、保存版本。</p>
    </div>
  `;
}

function renderScriptPart(part, index) {
  const active = part.id === state.selectedPartId ? "active" : "";
  return `
    <article class="script-part ${active}" data-part="${part.id}" draggable="true">
      <button class="drag-handle" type="button" title="拖拽调整段落顺序" aria-label="拖拽调整段落顺序"></button>
      <span class="part-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="part-body">
        <input class="part-label" data-part-label="${part.id}" value="${escapeHtml(part.label)}" />
        <input class="part-title" data-part-title="${part.id}" value="${escapeHtml(part.title)}" />
        <textarea class="part-content" data-part-content="${part.id}">${escapeHtml(part.content)}</textarea>
      </div>
      <div class="part-actions">
        <button class="mini-action" data-part-action="improve" data-part-id="${part.id}">优化</button>
        <button class="mini-action" data-part-action="copy" data-part-id="${part.id}">复制</button>
        <button class="mini-action" data-part-action="delete" data-part-id="${part.id}">删除</button>
      </div>
    </article>
  `;
}

function renderVersionBar() {
  if (!state.versions.length) {
    return `<div class="version-bar">尚未保存版本。点击“保存脚本”后，这里会出现可回看的版本记录。</div>`;
  }
  return `<div class="version-bar">${state.versions.map(item => (
    `<button data-version="${item.id}"><b>${item.label}</b><span>${item.time}</span></button>`
  )).join("")}</div>`;
}

function renderTunePanel() {
  const current = state.script.find(item => item.id === state.selectedPartId) || state.script[0];
  const disabled = state.hasGenerated ? "" : "disabled";
  return `
    <p class="section-label">Tuning</p>
    <h2>脚本调校</h2>
    <div class="tune-card">
      <span>当前模型</span>
      <strong>${model().label}</strong>
      <em>${model().note}</em>
    </div>
    <div class="tune-card">
      <span>当前段落</span>
      <strong>${current ? current.label : "未生成"}</strong>
      <em>${current ? current.title : "生成后可选中段落修改"}</em>
    </div>
    <button class="button wide" id="regenerateBtn" type="button" ${disabled}>重新生成全文</button>
    <button class="button soft wide" id="duplicateVersionBtn" type="button" ${disabled}>复制为新版本</button>
    <button class="button wide" id="copyScriptBtn" type="button" ${disabled}>复制脚本文本</button>
  `;
}

function renderLibrary() {
  $("#libraryFilters").innerHTML = ["全部", "客户素材", "参考文件", "历史脚本"].map(item => (
    `<button class="${state.libraryFilter === item ? "active" : ""}" data-library-filter="${item}">${item}</button>`
  )).join("");

  const rows = libraryRows();
  $("#libraryList").innerHTML = rows.length ? rows.map(renderLibraryRow).join("") : (
    `<div class="empty-small">没有匹配资料。可以清空搜索，或上传一条新资料。</div>`
  );
  renderLibraryDetail(rows[0]);
}

function libraryRows() {
  const query = state.libraryQuery.trim().toLowerCase();
  return state.projects.flatMap(item => item.materials.map(material => ({ project: item, material })))
    .filter(row => state.libraryFilter === "全部" || row.material.type === state.libraryFilter)
    .filter(row => !query || `${row.project.name}${row.material.title}${row.material.text}`.toLowerCase().includes(query))
    .filter(row => canAdmin() || row.material.scope === "全员" || account().permission === "write");
}

function renderLibraryRow(row) {
  const active = row.material.id === state.activeMaterialId ? "active" : "";
  return `
    <button class="library-row ${active}" data-material="${row.material.id}" data-row-project="${row.project.id}">
      <span><b>${row.material.title}</b><em>${row.project.name}</em></span>
      <i>${row.material.type}</i>
      <small>${row.material.scope}</small>
    </button>
  `;
}

function renderLibraryDetail(row) {
  const selected = findMaterial(state.activeMaterialId) || row;
  if (!selected) {
    $("#libraryDetail").innerHTML = `<p class="section-label">Detail</p><h2>暂无资料</h2>`;
    return;
  }
  $("#libraryDetail").innerHTML = `
    <p class="section-label">Selected Material</p>
    <h2>${selected.material.title}</h2>
    <div class="meta-list">
      <span>项目 <b>${selected.project.name}</b></span>
      <span>类型 <b>${selected.material.type}</b></span>
      <span>可见 <b>${selected.material.scope}</b></span>
    </div>
    <div class="material-preview">${escapeHtml(selected.material.text)}</div>
    <button class="button filled wide" data-apply-material="${selected.material.id}">应用到素材输入</button>
    <button class="button wide" data-select-project="${selected.project.id}">设为当前项目</button>
  `;
}

function findMaterial(materialId) {
  for (const item of state.projects) {
    const material = item.materials.find(entry => entry.id === materialId);
    if (material) return { project: item, material };
  }
  return null;
}

function renderSettings() {
  const current = account();
  $("#profilePanel").innerHTML = `
    <p class="section-label">Profile</p>
    <h2>账号设置</h2>
    <div class="profile-card">
      <span>登录账号</span><strong>${current.login}</strong>
      <span>权限</span><strong>${permissionText(current.permission)}</strong>
      <p>${current.description}</p>
    </div>
    <label class="field-label" for="accountSwitcher">切换演示账号</label>
    <select id="accountSwitcher">
      ${accounts.map(item => `<option value="${item.id}" ${item.id === state.accountId ? "selected" : ""}>${item.name}</option>`).join("")}
    </select>
  `;

  $("#adminPanel").innerHTML = canAdmin() ? renderAdminTable() : `
    <p class="section-label">Admin</p>
    <h2>管理员功能</h2>
    <div class="empty-small">当前账号没有账号管理权限。切换到管理员后，可重置密码和调整其他账号的使用权限。</div>
  `;
}

function renderAdminTable() {
  return `
    <p class="section-label">Admin</p>
    <h2>账号权限管理</h2>
    <div class="account-table">
      ${accounts.map(item => `
        <div class="account-row">
          <span><b>${item.name}</b><em>${item.login}</em></span>
          <select data-account-permission="${item.id}">
            <option value="admin" ${item.permission === "admin" ? "selected" : ""}>管理员</option>
            <option value="write" ${item.permission === "write" ? "selected" : ""}>正常使用</option>
            <option value="read" ${item.permission === "read" ? "selected" : ""}>只读查看</option>
          </select>
          <button class="button small" data-reset-password="${item.id}" type="button">重置密码</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAll() {
  updateChrome();
  renderProjectSelect();
  renderControls();
  renderScriptArea();
  renderLibrary();
  renderSettings();
}

function setView(view) {
  state.view = view;
  $$(".view").forEach(item => item.classList.toggle("active", item.id === `${view}View`));
  $$("[data-nav]").forEach(item => item.classList.toggle("active", item.dataset.nav === view));
  updateChrome();
}

function selectProject(projectId) {
  state.projectId = projectId;
  const firstMaterial = project().materials[0];
  if (firstMaterial) state.activeMaterialId = firstMaterial.id;
  renderAll();
}

function selectPart(partId) {
  state.selectedPartId = partId;
  renderScriptArea();
}

function updatePart(id, patch) {
  state.script = state.script.map(item => item.id === id ? { ...item, ...patch } : item);
}

async function generateScript() {
  if (!guardWrite("生成脚本")) return;
  const text = $("#sourceText").value.trim();
  if (text.length < 12) {
    openModal({
      kicker: "Material",
      title: "素材太短",
      body: `<p>当前素材信息不足，生成结果会更依赖假设。可以先导入示例素材，也可以继续生成一版粗稿。</p>`,
      actions: [
        { id: "use-example", label: "导入示例素材", style: "filled" },
        { id: "force-generate", label: "继续生成" }
      ]
    });
    return;
  }

  state.sourceText = text;
  $("#scriptArea").innerHTML = renderProgress();
  await stepProgress();

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: text, model: model().label })
    });
    const payload = await response.json();
    if (payload.ok && Array.isArray(payload.script)) {
      state.script = payload.script;
    } else {
      state.script = buildScript(text);
    }
  } catch {
    state.script = buildScript(text);
  }

  state.hasGenerated = true;
  state.selectedPartId = state.script[0]?.id || "part-1";
  renderScriptArea();
  showToast("脚本文档已生成，可以直接编辑");
}

function renderProgress() {
  return `
    <section class="panel progress-panel">
      <p class="section-label">Working</p>
      <h2>正在生成脚本文档</h2>
      <div class="progress-list">
        ${generationSteps.map(step => `<span>${step}<b>等待</b></span>`).join("")}
      </div>
    </section>
  `;
}

async function stepProgress() {
  for (const step of $$(".progress-list span")) {
    await new Promise(resolve => setTimeout(resolve, 220));
    step.classList.add("done");
    step.querySelector("b").textContent = "完成";
  }
}

function buildScript(material) {
  const base = structuredClone(defaultScript);
  const short = material.replace(/\s+/g, " ").slice(0, 72);
  base[0].content = `开场直接抓住客户素材中的核心处境：${short}。让观众先看到人物遇到的具体麻烦，而不是先听产品说明。`;
  base[1].content = "人物尝试用旧办法解决问题，但越处理越乱。这里保留一点幽默误会，让冲突自然推进。";
  base[2].content = "产品能力在一次具体动作中出现：它不是旁白解释，而是帮人物把事情变简单、变稳定。";
  base[3].content = "结尾用一个轻松反应收束，让观众记住“问题被解决”的感觉，同时留下明确的行动句。";
  return base.map(item => ({ ...item, id: textToId("part") }));
}

function improvePart(id = state.selectedPartId) {
  if (!guardWrite("优化脚本")) return;
  updatePart(id, {
    content: `${state.script.find(item => item.id === id)?.content || ""}\n\n优化补充：把人物反应写得更具体，卖点只落在一个清晰动作上，避免解释过多。`
  });
  renderScriptArea();
  showToast("选中段落已优化");
}

function copyPart(id) {
  const target = state.script.find(item => item.id === id);
  if (!target) return;
  if (!guardWrite("复制段落")) return;
  const index = state.script.findIndex(item => item.id === id);
  state.script.splice(index + 1, 0, { ...target, id: textToId("part"), title: `${target.title}副本` });
  renderScriptArea();
  showToast("段落已复制");
}

function deletePart(id) {
  if (!guardWrite("删除段落")) return;
  if (state.script.length <= 1) {
    showToast("至少保留一个段落");
    return;
  }
  state.script = state.script.filter(item => item.id !== id);
  state.selectedPartId = state.script[0].id;
  renderScriptArea();
  showToast("段落已删除，顺序已自动更新");
}

function saveScript() {
  if (!guardWrite("保存脚本")) return;
  const version = {
    id: textToId("version"),
    label: `V${state.versions.length + 1}`,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    script: structuredClone(state.script)
  };
  state.versions.unshift(version);
  renderScriptArea();
  showToast(`${version.label} 已保存`);
}

function duplicateVersion() {
  if (!guardWrite("复制版本")) return;
  saveScript();
  showToast("已复制为新版本，可继续修改");
}

function scriptText() {
  return state.script.map((item, index) => (
    `${index + 1}. ${item.label}｜${item.title}\n${item.content}`
  )).join("\n\n");
}

function openExportModal() {
  if (!state.hasGenerated) {
    showToast("请先生成脚本文档");
    return;
  }
  openModal({
    kicker: "Export",
    title: "导出当前脚本",
    body: `<p>原型会生成可下载文件，正式开发时再替换成真实 Word/PDF 服务。</p>
      <div class="export-box"><b>${project().name}</b><span>${state.script.length} 个脚本段落</span></div>`,
    actions: [
      { id: "download-doc", label: "下载 Word 文档", style: "filled" },
      { id: "download-pdf", label: "下载 PDF 文档" },
      { id: "close", label: "完成" }
    ]
  });
}

function downloadFile(kind) {
  const ext = kind === "doc" ? "doc" : "txt";
  const mime = kind === "doc" ? "application/msword" : "text/plain";
  const blob = new Blob([scriptText()], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project().name}-脚本文档.${ext}`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(kind === "doc" ? "Word 文档已生成" : "PDF 演示文件已生成");
}

function copyScriptText() {
  navigator.clipboard?.writeText(scriptText()).then(
    () => showToast("脚本文本已复制"),
    () => showToast("复制失败，可手动选择文本")
  );
}

function openImportModal() {
  const rows = project().materials.map(item => (
    `<button class="material-choice" data-import-material="${item.id}">
      <b>${item.title}</b><span>${item.type} · ${item.scope}</span>
    </button>`
  )).join("");
  openModal({
    kicker: "Import",
    title: "从当前项目导入素材",
    body: `<div class="material-choices">${rows}</div>`,
    actions: [{ id: "close", label: "取消" }]
  });
}

function openUploadModal() {
  if (!guardWrite("上传资料")) return;
  openModal({
    kicker: "Upload",
    title: "上传一条项目资料",
    body: `<label class="modal-field">资料标题<input id="uploadTitle" value="新客户素材" /></label>
      <label class="modal-field">资料内容<textarea id="uploadText">这里是一段新的客户素材，可以被导入到脚本输入框。</textarea></label>`,
    actions: [
      { id: "confirm-upload", label: "保存到项目资料", style: "filled" },
      { id: "close", label: "取消" }
    ]
  });
}

function confirmUpload() {
  const title = $("#uploadTitle")?.value.trim() || "新客户素材";
  const text = $("#uploadText")?.value.trim() || "未填写内容";
  const material = {
    id: textToId("material"),
    type: "客户素材",
    title,
    scope: "全员",
    text
  };
  project().materials.unshift(material);
  state.activeMaterialId = material.id;
  state.sourceText = text;
  closeModal();
  renderAll();
  showToast("资料已保存并导入输入框");
}

function openNewProjectModal() {
  if (!guardWrite("新建项目")) return;
  openModal({
    kicker: "Project",
    title: "新建项目",
    body: `<label class="modal-field">项目名称<input id="newProjectName" value="新客户项目" /></label>`,
    actions: [
      { id: "confirm-new-project", label: "创建项目", style: "filled" },
      { id: "close", label: "取消" }
    ]
  });
}

function confirmNewProject() {
  const name = $("#newProjectName")?.value.trim() || "新客户项目";
  const next = {
    id: textToId("project"),
    name,
    owner: account().name,
    updated: "刚刚",
    materials: []
  };
  state.projects.unshift(next);
  state.projectId = next.id;
  closeModal();
  renderAll();
  showToast("项目已创建，可以上传客户素材");
}

function applyMaterial(materialId) {
  const selected = findMaterial(materialId);
  if (!selected) return;
  state.projectId = selected.project.id;
  state.activeMaterialId = selected.material.id;
  state.sourceText = selected.material.text;
  renderAll();
  setView("work");
  closeModal();
  showToast("资料已应用到素材输入");
}

function resetPassword(accountId) {
  const target = accounts.find(item => item.id === accountId);
  const password = `tmp-${Math.random().toString(36).slice(2, 8)}`;
  openModal({
    kicker: "Password",
    title: `已重置 ${target.name} 密码`,
    body: `<p>临时密码：</p><div class="password-box">${password}</div><p>正式开发时，这里会走后端接口并记录操作日志。</p>`,
    actions: [{ id: "close", label: "完成", style: "filled" }]
  });
}

function setPermission(accountId, permission) {
  const target = accounts.find(item => item.id === accountId);
  if (!target) return;
  target.permission = permission;
  renderSettings();
  updateChrome();
  showToast(`${target.name} 已改为${permissionText(permission)}`);
}

function bindDragEvents() {
  $$(".script-part").forEach(part => {
    part.addEventListener("dragstart", () => part.classList.add("dragging"));
    part.addEventListener("dragend", () => {
      part.classList.remove("dragging");
      syncPartOrder();
    });
    part.addEventListener("dragover", event => {
      event.preventDefault();
      const dragging = $(".script-part.dragging");
      if (!dragging || dragging === part) return;
      const after = event.offsetY > part.offsetHeight / 2;
      part.parentNode.insertBefore(dragging, after ? part.nextSibling : part);
    });
  });
}

function syncPartOrder() {
  const ids = $$(".script-part").map(item => item.dataset.part);
  state.script = ids.map(id => state.script.find(part => part.id === id)).filter(Boolean);
  renderScriptArea();
  showToast("段落顺序已更新");
}

function handleClick(event) {
  const target = event.target.closest("button, [data-material], [data-import-material]");
  const partNode = event.target.closest(".script-part");
  const editingNode = event.target.closest("input, textarea, button");
  if (!target) {
    if (partNode && !editingNode) selectPart(partNode.dataset.part);
    return;
  }

  if (target.dataset.loginAccount) {
    state.accountId = target.dataset.loginAccount;
    $("#loginAccount").value = account().login;
    return;
  }
  if (target.dataset.nav) setView(target.dataset.nav);
  if (target.dataset.project) selectProject(target.dataset.project);
  if (target.dataset.example) {
    state.sourceText = target.dataset.example;
    renderControls();
  }
  if (target.id === "generateBtn") generateScript();
  if (target.id === "clearSourceBtn" && guardWrite("清空素材")) {
    state.sourceText = "";
    renderControls();
  }
  if (target.id === "importMaterialBtn") openImportModal();
  if (target.id === "uploadMaterialBtn" || target.id === "libraryUploadBtn") openUploadModal();
  if (target.id === "newProjectBtn") openNewProjectModal();
  if (target.id === "saveScriptBtn") saveScript();
  if (target.id === "optimizePartBtn") improvePart();
  if (target.id === "exportBtn") openExportModal();
  if (target.id === "regenerateBtn") generateScript();
  if (target.id === "duplicateVersionBtn") duplicateVersion();
  if (target.id === "copyScriptBtn") copyScriptText();
  if (target.dataset.part) selectPart(target.dataset.part);
  if (target.dataset.partAction === "improve") improvePart(target.dataset.partId);
  if (target.dataset.partAction === "copy") copyPart(target.dataset.partId);
  if (target.dataset.partAction === "delete") deletePart(target.dataset.partId);
  if (target.dataset.material) {
    state.activeMaterialId = target.dataset.material;
    renderLibrary();
  }
  if (target.dataset.importMaterial) applyMaterial(target.dataset.importMaterial);
  if (target.dataset.applyMaterial) applyMaterial(target.dataset.applyMaterial);
  if (target.dataset.selectProject) selectProject(target.dataset.selectProject);
  if (target.dataset.resetPassword) resetPassword(target.dataset.resetPassword);
  if (target.dataset.libraryFilter) {
    state.libraryFilter = target.dataset.libraryFilter;
    renderLibrary();
  }
  if (target.dataset.version) {
    const version = state.versions.find(item => item.id === target.dataset.version);
    if (version) {
      state.script = structuredClone(version.script);
      state.hasGenerated = true;
      state.selectedPartId = state.script[0]?.id;
      renderScriptArea();
      showToast(`${version.label} 已恢复到编辑区`);
    }
  }

  if (partNode && !editingNode) selectPart(partNode.dataset.part);
}

function handleFocusIn(event) {
  const partNode = event.target.closest(".script-part");
  if (!partNode || state.selectedPartId === partNode.dataset.part) return;
  state.selectedPartId = partNode.dataset.part;
  $$(".script-part").forEach(item => item.classList.toggle("active", item === partNode)); $("#tunePanel").innerHTML = renderTunePanel();
}

function handleInput(event) {
  const target = event.target;
  if (target.id === "sourceText") state.sourceText = target.value;
  if (target.id === "librarySearch") {
    state.libraryQuery = target.value;
    renderLibrary();
  }
  if (target.dataset.partLabel) updatePart(target.dataset.partLabel, { label: target.value });
  if (target.dataset.partTitle) updatePart(target.dataset.partTitle, { title: target.value });
  if (target.dataset.partContent) updatePart(target.dataset.partContent, { content: target.value });
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "projectSelect") selectProject(target.value);
  if (target.id === "modelSelect") { state.modelId = target.value; renderScriptArea(); }
  if (target.id === "accountSwitcher") {
    state.accountId = target.value;
    renderAll();
  }
  if (target.dataset.accountPermission) setPermission(target.dataset.accountPermission, target.value);
}

function handleModalAction(event) {
  const action = event.target.closest("[data-modal-action]")?.dataset.modalAction;
  if (!action) return;
  if (action === "close") closeModal();
  if (action === "go-settings") {
    closeModal();
    setView("settings");
  }
  if (action === "use-example") {
    state.sourceText = exampleMaterials[0].text;
    closeModal();
    renderControls();
  }
  if (action === "force-generate") {
    closeModal();
    $("#sourceText").value = `${$("#sourceText").value.trim()} 补充：请根据行业经验补齐脚本结构。`;
    generateScript();
  }
  if (action === "download-doc") downloadFile("doc");
  if (action === "download-pdf") downloadFile("pdf");
  if (action === "confirm-upload") confirmUpload();
  if (action === "confirm-new-project") confirmNewProject();
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
  document.addEventListener("focusin", handleFocusIn);
  nodes.modalActions.addEventListener("click", handleModalAction);
  $("#modalClose").addEventListener("click", closeModal);
  nodes.modalLayer.addEventListener("click", event => {
    if (event.target === nodes.modalLayer) closeModal();
  });
  $("[data-theme='paper']").classList.add("active");
  $$("[data-theme]").forEach(button => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      document.body.dataset.theme = state.theme;
      $$("[data-theme]").forEach(item => item.classList.toggle("active", item === button));
    });
  });
}

renderAll();
bindEvents();
