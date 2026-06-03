export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createLoadingOverlay(filename: string): void {
  const el = document.createElement("div");
  el.id = "loading-overlay";
  el.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-label" id="loading-label">Loading ${filename}…</div>
    <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
  `;
  document.body.appendChild(el);
}

export function dismissLoading(): void {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("fade-out");
  setTimeout(() => overlay.remove(), 450);
}

export function showError(message: string): void {
  document.getElementById("loading-overlay")?.remove();
  const el = document.createElement("div");
  el.id = "error-overlay";
  el.innerHTML = `
    <div class="error-icon">⚠</div>
    <div class="error-title">Failed to load PLY file</div>
    <div class="error-msg">${escapeHtml(message)}</div>
  `;
  document.body.appendChild(el);
}

export function createStatsPanel(filename: string): void {
  const panel = document.createElement("div");
  panel.id = "stats-panel";
  panel.innerHTML = `
    <div class="stat-title" id="stat-filename" title="${filename}">${filename}</div>
    <div class="stat-row"><span class="stat-key">Type</span><span class="stat-val" id="stat-type">—</span></div>
    <div class="stat-row"><span class="stat-key">Vertices</span><span class="stat-val" id="stat-verts">—</span></div>
    <div class="stat-row"><span class="stat-key">Faces</span><span class="stat-val" id="stat-faces">—</span></div>
    <div class="stat-row"><span class="stat-key">Colors</span><span class="stat-val" id="stat-colors">—</span></div>
    <div class="stat-row"><span class="stat-key">Normals</span><span class="stat-val" id="stat-normals">—</span></div>
  `;
  document.body.appendChild(panel);
}

export function updateStats(
  type: string,
  verts: number,
  faces: number,
  colors: boolean,
  normals: boolean,
): void {
  const fmt = (n: number) => n.toLocaleString();
  const set = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("stat-type", type);
  set("stat-verts", fmt(verts));
  set("stat-faces", faces > 0 ? fmt(faces) : "—");
  set("stat-colors", colors ? "Yes" : "No");
  set("stat-normals", normals ? "Yes" : "Computed");
}

export function updateStatsFilename(filename: string): void {
  const el = document.getElementById("stat-filename");
  if (el) {
    el.textContent = filename;
    el.title = filename;
  }
}

export function setLoadingProgress(pct: number): void {
  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = `${pct}%`;
}

export function showLoadingOverlay(filename: string): void {
  document.getElementById("loading-overlay")?.remove();
  createLoadingOverlay(filename);
}

export function createSettingsPanel(): void {
  const panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.innerHTML = `
    <div class="panel-title">Settings</div>
    <div class="setting-row" id="row-point-size">
      <span class="setting-label">Point size</span>
      <input type="range" id="point-size" min="1" max="30" value="5" step="1">
    </div>
    <div class="setting-row" id="row-wireframe" style="display:none">
      <span class="setting-label">Wireframe</span>
      <input type="checkbox" id="wireframe-toggle">
    </div>
    <div class="setting-row">
      <span class="setting-label">Grid</span>
      <input type="checkbox" id="grid-toggle" checked>
    </div>
    <div class="setting-row">
      <span class="setting-label">Axes</span>
      <input type="checkbox" id="axes-toggle" checked>
    </div>
    <div class="setting-col">
      <span class="setting-label">Up axis</span>
      <div class="axis-btns">
        <button class="axis-btn" data-axis="X+">X+</button>
        <button class="axis-btn" data-axis="X-">X−</button>
        <button class="axis-btn active" data-axis="Y+">Y+</button>
        <button class="axis-btn" data-axis="Y-">Y−</button>
        <button class="axis-btn" data-axis="Z+">Z+</button>
        <button class="axis-btn" data-axis="Z-">Z−</button>
      </div>
    </div>
    <hr class="divider">
    <div class="setting-row">
      <span class="setting-label">Background</span>
      <div class="bg-swatches">
        <div class="bg-swatch active" id="bg-0" style="background:#1a1a2e" title="Dark blue"></div>
        <div class="bg-swatch" id="bg-1" style="background:#222222" title="Dark grey"></div>
        <div class="bg-swatch" id="bg-2" style="background:#000000" title="Black"></div>
        <div class="bg-swatch" id="bg-3" style="background:#e0e0e0" title="Light"></div>
      </div>
    </div>
    <button class="btn-reset" id="btn-reset">⟳ Reset Camera &nbsp;(R)</button>
  `;
  document.body.appendChild(panel);
}

export function createControlsHint(): void {
  const hint = document.createElement("div");
  hint.id = "controls-hint";
  const hasNav = (window as Window & { plySiblingNames?: string[] }).plySiblingNames?.length > 1;
  hint.textContent = hasNav
    ? "Drag: look around  ·  Scroll: forward/back  ·  WASD: fly  ·  ←→: prev/next  ·  R: reset"
    : "Drag: look around  ·  Scroll: forward/back  ·  WASD: fly  ·  Space/Shift: up/down  ·  R: reset";
  document.body.appendChild(hint);
}

export function createFileBrowser(
  files: string[],
  currentIndex: number,
  onSelect: (index: number) => void,
): void {
  document.getElementById("file-browser")?.remove();
  if (files.length <= 1) return;

  const bar = document.createElement("div");
  bar.id = "file-browser";

  const prev = document.createElement("button");
  prev.className = "fb-btn";
  prev.textContent = "◀";
  prev.disabled = currentIndex === 0;
  prev.addEventListener("click", () => onSelect(currentIndex - 1));

  const list = document.createElement("div");
  list.className = "fb-list";

  files.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "fb-file" + (i === currentIndex ? " active" : "");
    btn.textContent = name;
    btn.title = name;
    btn.addEventListener("click", () => onSelect(i));
    list.appendChild(btn);
  });

  const next = document.createElement("button");
  next.className = "fb-btn";
  next.textContent = "▶";
  next.disabled = currentIndex === files.length - 1;
  next.addEventListener("click", () => onSelect(currentIndex + 1));

  bar.appendChild(prev);
  bar.appendChild(list);
  bar.appendChild(next);
  document.body.appendChild(bar);

  // Scroll active file into view
  const active = list.querySelector(".fb-file.active") as HTMLElement | null;
  active?.scrollIntoView({ block: "nearest", inline: "center" });
}
