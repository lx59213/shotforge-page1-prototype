const esc = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export function railProjectsMarkup(projects, selectedId, collapsed) {
  if (collapsed) return "";
  return projects.slice(0, 9).map(project => `
    <button class="rail-project-row ${project.id === selectedId ? "active" : ""}" data-rail-project="${project.id}" type="button" title="${esc(project.name)}">
      <span>${esc(project.name)}</span><em>${project.files.length} 项</em>
    </button>
  `).join("") || `<div class="rail-empty">还没有项目</div>`;
}

export function accountPopoverMarkup({ user, type, projectCount, modelCount }) {
  return `
    <div class="popover-user">
      <span>${esc(user.name.slice(0, 1))}</span>
      <div><strong>${esc(user.name)}</strong><em>${esc(user.login)}</em></div>
    </div>
    <div class="popover-menu">
      <button data-account-menu="settings" type="button">个人资料与设置</button>
    </div>
    <button class="popover-logout" data-account-menu="logout" type="button">退出登录</button>
  `;
}
