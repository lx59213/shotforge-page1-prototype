import { examples, fallbackShots, generateSteps, libraries, models } from "./data.js";

const state = {
  role: "导演",
  view: "brief",
  model: models[0],
  shots: [...fallbackShots],
  selectedShotId: "03",
  libraryFilter: "全部资料"
};

const appShell = document.querySelector("#appShell");
const loginScreen = document.querySelector("#loginScreen");
const roleChip = document.querySelector("#roleChip");
const stageText = document.querySelector("#stageText");
const toast = document.querySelector("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function setRole(role) {
  state.role = role;
  roleChip.textContent = `${role}模式`;
  document.querySelectorAll("[data-role]").forEach(button => {
    button.classList.toggle("active", button.dataset.role === role);
  });
  document.querySelectorAll(".edit-action").forEach(item => {
    item.disabled = role === "客户";
  });
  renderLibraries();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach(node => node.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  const activeButton = document.querySelector(`[data-view="${view}"]`);
  stageText.textContent = activeButton?.dataset.stage || "页面 1";
  if (view === "client") setRole("客户");
}

function renderExamples() {
  document.querySelector("#exampleRow").innerHTML = examples.map(item => (
    `<button type="button" data-example="${item.text}">${item.label}</button>`
  )).join("");
}

function renderModels() {
  document.querySelector("#modelMenu").innerHTML = models.map(model => (
    `<button class="model-option ${model.id === state.model.id ? "active" : ""}" data-model="${model.id}">
      <i></i><span>${model.label} · ${model.note}</span>
    </button>`
  )).join("");
  document.querySelector("#modelLabel").textContent = `${state.model.label} · ${state.model.note}`;
}

function gripIcon() {
  return `<svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
    <circle cx="4" cy="4" r="1.2"/><circle cx="10" cy="4" r="1.2"/>
    <circle cx="4" cy="9" r="1.2"/><circle cx="10" cy="9" r="1.2"/>
    <circle cx="4" cy="14" r="1.2"/><circle cx="10" cy="14" r="1.2"/>
  </svg>`;
}

function shotRow(shot, compact = false) {
  const selected = shot.id === state.selectedShotId ? "selected" : "";
  if (compact) {
    return `<div class="shot-row ${selected}" data-shot="${shot.id}">
      <span class="shot-id">${shot.id}</span>
      <span class="shot-copy">${shot.image}</span>
      <span><i class="pill">${shot.shot}</i></span>
      <span><i class="pill">${shot.move}</i></span>
      <span>${shot.time}</span>
      <span><i class="pill">可批注</i></span>
    </div>`;
  }

  return `<div class="shot-row ${selected}" data-shot="${shot.id}" draggable="true">
    <span class="grip">${gripIcon()}</span>
    <span class="shot-id">${shot.id}</span>
    <span class="shot-copy" data-edit-field="image" title="双击可编辑">${shot.image}</span>
    <span><i class="pill">${shot.shot}</i></span>
    <span><i class="pill">${shot.move}</i></span>
    <span>${shot.time}</span>
    <span class="row-actions">
      <button class="mini-action edit-action" data-action="rewrite">重写</button>
      <button class="mini-action edit-action" data-action="split">拆分</button>
      <button class="mini-action" data-action="more">更多</button>
    </span>
  </div>`;
}

function renderShots() {
  document.querySelector("#shotList").innerHTML = state.shots.map(shot => shotRow(shot)).join("");
  renderInspector();
  bindShotEvents();
}

function selectShot(id) {
  state.selectedShotId = id;
  document.querySelectorAll("#shotList .shot-row").forEach(row => {
    row.classList.toggle("selected", row.dataset.shot === id);
  });
  renderInspector();
}

function renderClientTable() {
  document.querySelector("#clientTable").innerHTML = `
    <div class="table-head"><span>镜头</span><span>画面描述</span><span>景别</span><span>运镜</span><span>时长</span><span>状态</span></div>
    ${state.shots.map(shot => shotRow(shot, true)).join("")}
  `;
}

function renderInspector() {
  const shot = state.shots.find(item => item.id === state.selectedShotId) || state.shots[0];
  if (!shot) return;
  document.querySelector("#inspector").innerHTML = `
    <p class="section-label">Shot ${shot.id}</p>
    <h2>镜头编辑</h2>
    <label class="field-label">画面描述</label>
    <textarea class="inspect-textarea" id="shotImageText">${shot.image}</textarea>
    <label class="field-label">英文生图关键词</label>
    <textarea class="inspect-textarea small" id="keywordText">${shot.keywords}</textarea>
    <div class="inspect-block">
      <strong>AI 拆解理由</strong><br />
      当前镜头可以继续拆细，也可以只改这一镜，前后镜头不会被覆盖。
    </div>
    <button class="button soft wide edit-action" id="saveShotBtn">保存当前镜头修改</button>
    <button class="button filled wide edit-action" data-inspector-action="split">扩写成多镜头</button>
    <button class="button wide edit-action" data-inspector-action="keyword">重新生成关键词</button>
  `;
  document.querySelector("#saveShotBtn").addEventListener("click", saveInspectorShot);
  document.querySelectorAll("[data-inspector-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.inspectorAction === "split") splitSelectedShot();
      if (button.dataset.inspectorAction === "keyword") regenerateKeywords();
    });
  });
  setRole(state.role);
}

function bindShotEvents() {
  document.querySelectorAll("#shotList .shot-row").forEach(row => {
    row.addEventListener("click", event => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      selectShot(row.dataset.shot);
      if (action === "split") splitSelectedShot();
      if (action === "rewrite") rewriteSelectedShot();
      if (action === "more") showToast("更多操作：这里后续可接删除、复制、备注");
    });

    row.querySelector("[data-edit-field]")?.addEventListener("dblclick", event => {
      event.stopPropagation();
      startInlineEdit(event.currentTarget, row.dataset.shot);
    });

    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      syncOrderFromDom();
    });
    row.addEventListener("dragover", event => {
      event.preventDefault();
      const dragging = document.querySelector(".dragging");
      if (!dragging || dragging === row) return;
      const after = event.offsetY > row.offsetHeight / 2;
      row.parentNode.insertBefore(dragging, after ? row.nextSibling : row);
    });
  });
}

function syncOrderFromDom() {
  const ids = [...document.querySelectorAll("#shotList .shot-row")].map(row => row.dataset.shot);
  state.shots = ids.map(id => state.shots.find(shot => shot.id === id)).filter(Boolean);
  renumberShots();
  state.selectedShotId = state.shots[Math.min(2, state.shots.length - 1)]?.id || "01";
  renderShots();
  renderClientTable();
  showToast("镜头顺序已重排，编号已自动更新");
}

function renumberShots() {
  state.shots = state.shots.map((shot, index) => ({ ...shot, id: String(index + 1).padStart(2, "0") }));
}

function updateShot(id, patch) {
  state.shots = state.shots.map(shot => shot.id === id ? { ...shot, ...patch } : shot);
  renderShots();
  renderClientTable();
}

function startInlineEdit(node, id) {
  node.contentEditable = "true";
  node.classList.add("editing");
  node.focus();
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const finish = () => {
    node.contentEditable = "false";
    node.classList.remove("editing");
    updateShot(id, { image: node.textContent.trim() || "未填写画面描述" });
    showToast("画面描述已更新");
  };

  node.onblur = finish;
  node.onkeydown = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      node.blur();
    }
  };
}

function saveInspectorShot() {
  const image = document.querySelector("#shotImageText").value.trim();
  const keywords = document.querySelector("#keywordText").value.trim();
  updateShot(state.selectedShotId, {
    image: image || "未填写画面描述",
    keywords: keywords || "cinematic shot, clear subject, production reference"
  });
  showToast("当前镜头修改已保存");
}

function regenerateKeywords() {
  const shot = state.shots.find(item => item.id === state.selectedShotId);
  if (!shot) return;
  const next = `${shot.shot.toLowerCase()} shot, ${shot.move.toLowerCase()} camera, clear subject, cinematic commercial look`;
  updateShot(shot.id, { keywords: next });
  showToast("关键词已按当前画面描述重新生成");
}

function splitSelectedShot() {
  const index = state.shots.findIndex(shot => shot.id === state.selectedShotId);
  if (index < 0) return;
  const base = state.shots[index];
  const splits = ["拔剑对峙，冲突正式建立。", "剑锋交错，优惠券成为画面焦点。", "一人抢到券，另一人露出错愕反应。"].map((image, offset) => ({
    ...base,
    id: `${base.id}${String.fromCharCode(65 + offset)}`,
    image,
    time: offset === 1 ? "3s" : "2s"
  }));
  state.shots.splice(index, 1, ...splits);
  renumberShots();
  state.selectedShotId = String(index + 1).padStart(2, "0");
  renderShots();
  renderClientTable();
  showToast("已把选中镜头扩写成 3 个更细镜头");
}

function rewriteSelectedShot() {
  state.shots = state.shots.map(shot => shot.id === state.selectedShotId
    ? { ...shot, image: `${shot.image} 画面节奏更紧，产品露出更明确。` }
    : shot);
  renderShots();
  renderClientTable();
  showToast("当前镜头已局部重写");
}

function renderLibraries() {
  const filters = ["全部资料", "客户项目", "公共案例", "仅我可见"];
  document.querySelector("#libraryFilters").innerHTML = filters.map(filter => (
    `<button class="${filter === state.libraryFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>`
  )).join("");

  const allowedRows = libraries.filter(row => row.roles.includes(state.role) || state.role === "制片");
  const visibleRows = allowedRows.filter(row => {
    if (state.libraryFilter === "全部资料") return true;
    if (state.libraryFilter === "客户项目") return row.name.includes("客户");
    if (state.libraryFilter === "公共案例") return row.name.includes("公共");
    return row.visible.includes("仅本人");
  });
  document.querySelector("#libraryTable").innerHTML = `
    <div class="library-head"><span>资料库</span><span>数量</span><span>可见范围</span><span>标签</span><span>状态</span></div>
    ${visibleRows.map((row, index) => `
      <div class="library-row ${index === 1 ? "highlight" : ""}">
        <span>${row.name}</span><span>${row.count}</span><span>${row.visible}</span><span>${row.tags}</span><span><i class="pill">${row.state}</i></span>
      </div>
    `).join("")}
  `;

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      state.libraryFilter = button.dataset.filter;
      renderLibraries();
    });
  });
}

async function runGeneration() {
  const resultStage = document.querySelector("#resultStage");
  resultStage.innerHTML = `
    <div class="generating-state">
      <strong>正在拆解导演分镜</strong>
      <div class="generating-steps">${generateSteps.map(step => `<span>${step}<b>等待</b></span>`).join("")}</div>
    </div>
  `;
  const stepNodes = [...document.querySelectorAll(".generating-steps span")];
  for (const [index, node] of stepNodes.entries()) {
    await new Promise(resolve => setTimeout(resolve, 260));
    node.classList.add("done");
    node.querySelector("b").textContent = "完成";
    if (index === 2) document.querySelector("#storyState").textContent = "生成中 · 正在补景别与运镜";
  }

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: state.model.label, brief: document.querySelector("#briefText").value })
    });
    const payload = await response.json();
    if (payload.ok) state.shots = payload.shots;
  } catch {
    state.shots = [...fallbackShots];
  }

  state.selectedShotId = "03";
  document.querySelector("#storyState").textContent = "已生成 · 支持拖拽排序";
  renderShots();
  renderClientTable();
  setView("storyboard");
  showToast("分镜脚本已生成，可以开始局部修改");
}

function bindEvents() {
  document.querySelector("#loginForm").addEventListener("submit", event => {
    event.preventDefault();
    loginScreen.classList.add("hidden");
    appShell.classList.remove("hidden");
    setRole(state.role);
  });

  document.querySelectorAll("[data-login-role]").forEach(button => {
    button.addEventListener("click", () => {
      state.role = button.dataset.loginRole;
      loginScreen.classList.add("hidden");
      appShell.classList.remove("hidden");
      setRole(state.role);
      if (state.role === "客户") setView("client");
    });
  });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-view-jump]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.viewJump));
  });

  document.querySelectorAll("[data-role]").forEach(button => {
    button.addEventListener("click", () => setRole(button.dataset.role));
  });

  document.querySelectorAll("[data-theme]").forEach(button => {
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.theme;
      document.querySelectorAll("[data-theme]").forEach(item => item.classList.toggle("active", item === button));
    });
  });

  document.querySelector("#exampleRow").addEventListener("click", event => {
    const button = event.target.closest("[data-example]");
    if (button) document.querySelector("#briefText").value = button.dataset.example;
  });

  document.querySelector("#modelSelect").addEventListener("click", event => {
    const option = event.target.closest("[data-model]");
    if (option) {
      event.stopPropagation();
      state.model = models.find(model => model.id === option.dataset.model);
      document.querySelector("#modelSelect").classList.remove("open");
      renderModels();
      return;
    }
    document.querySelector("#modelSelect").classList.toggle("open");
  });

  document.querySelector("#generateBtn").addEventListener("click", runGeneration);
  document.querySelector("#saveVersionBtn").addEventListener("click", async () => {
    await fetch("/api/save", { method: "POST", body: "{}" }).catch(() => null);
    showToast("已保存为 V1 客户确认版");
  });

  document.querySelectorAll(".library-mini button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".library-mini button").forEach(item => item.classList.toggle("selected", item === button));
      setView("library");
      showToast(`${button.textContent.trim()} 已选中`);
    });
  });

  document.querySelectorAll(".library-hero .button").forEach(button => {
    button.addEventListener("click", () => showToast(`${button.textContent.trim()}：原型中展示入口，正式版接资料上传/筛选`));
  });

  document.querySelectorAll(".export-card").forEach(button => {
    button.addEventListener("click", () => showToast(`${button.textContent.trim()} 已加入导出队列`));
  });

  document.querySelectorAll("#clientView .button").forEach(button => {
    button.addEventListener("click", () => showToast(`${button.textContent.trim()} 已记录到客户预览流程`));
  });
}

renderExamples();
renderModels();
renderShots();
renderClientTable();
renderLibraries();
bindEvents();
