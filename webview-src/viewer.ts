import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

declare global {
  interface Window {
    plyFileUri: string;
    plyFileName: string;
  }
}

// ─── CSS ────────────────────────────────────────────────────────────────────
function injectStyles(): void {
  const style = document.createElement("style");
  style.textContent = `
        * { box-sizing: border-box; }
        body {
            margin: 0; padding: 0; overflow: hidden;
            background: #1a1a2e;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #ccd;
        }
        #canvas-container { width: 100vw; height: 100vh; display: block; }

        /* ── Loading overlay ── */
        #loading-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 15, 30, 0.92);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 200;
            transition: opacity 0.4s ease;
        }
        #loading-overlay.fade-out { opacity: 0; pointer-events: none; }
        .spinner {
            width: 52px; height: 52px;
            border: 4px solid rgba(102, 136, 255, 0.15);
            border-top-color: #6688ff;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
            margin-bottom: 18px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-label { font-size: 13px; color: #99a; margin-bottom: 10px; }
        .progress-track {
            width: 220px; height: 3px;
            background: rgba(255,255,255,0.08);
            border-radius: 2px; overflow: hidden;
        }
        .progress-fill {
            height: 100%; background: #6688ff;
            border-radius: 2px;
            transition: width 0.25s ease;
            width: 0%;
        }

        /* ── Stats panel ── */
        #stats-panel {
            position: fixed; top: 12px; right: 12px;
            background: rgba(18, 18, 36, 0.82);
            border: 1px solid rgba(102, 136, 255, 0.2);
            border-radius: 8px; padding: 10px 14px;
            font-size: 12px; min-width: 170px;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }
        .stat-title {
            font-size: 11px; font-weight: 600;
            color: #6688ff; letter-spacing: 0.06em;
            text-transform: uppercase; margin-bottom: 7px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            max-width: 160px;
        }
        .stat-row {
            display: flex; justify-content: space-between;
            gap: 10px; margin: 3px 0;
        }
        .stat-key { color: #778; font-size: 11px; }
        .stat-val { color: #adf; font-size: 11px; font-weight: 500; }

        /* ── Settings panel ── */
        #settings-panel {
            position: fixed; top: 12px; left: 12px;
            background: rgba(18, 18, 36, 0.82);
            border: 1px solid rgba(102, 136, 255, 0.2);
            border-radius: 8px; padding: 10px 14px;
            font-size: 12px; min-width: 175px;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }
        .panel-title {
            font-size: 11px; font-weight: 600; color: #6688ff;
            letter-spacing: 0.06em; text-transform: uppercase;
            margin-bottom: 9px;
        }
        .setting-row {
            display: flex; align-items: center;
            justify-content: space-between;
            gap: 8px; margin: 5px 0;
        }
        .setting-label { color: #889; font-size: 11px; flex-shrink: 0; }
        input[type="range"] {
            width: 78px; accent-color: #6688ff; cursor: pointer;
            background: transparent;
        }
        input[type="checkbox"] { accent-color: #6688ff; cursor: pointer; }
        .bg-swatches { display: flex; gap: 5px; }
        .bg-swatch {
            width: 18px; height: 18px; border-radius: 4px;
            border: 1.5px solid rgba(255,255,255,0.15);
            cursor: pointer; transition: transform 0.1s, border-color 0.1s;
            flex-shrink: 0;
        }
        .bg-swatch:hover { transform: scale(1.15); }
        .bg-swatch.active { border-color: #6688ff; }
        .btn-reset {
            margin-top: 8px; width: 100%;
            background: rgba(102, 136, 255, 0.15);
            border: 1px solid rgba(102, 136, 255, 0.35);
            color: #aac; border-radius: 5px;
            padding: 5px 10px; font-size: 11px;
            cursor: pointer; transition: background 0.15s;
        }
        .btn-reset:hover { background: rgba(102, 136, 255, 0.3); }
        .setting-col {
            display: flex; flex-direction: column; gap: 4px; margin: 5px 0;
        }
        .axis-btns { display: flex; gap: 3px; flex-wrap: wrap; }
        .axis-btn {
            padding: 2px 7px; font-size: 10px;
            background: rgba(102,136,255,0.1);
            border: 1px solid rgba(102,136,255,0.2);
            color: #99a; border-radius: 4px;
            cursor: pointer; transition: background 0.15s, border-color 0.15s;
        }
        .axis-btn:hover { background: rgba(102,136,255,0.25); }
        .axis-btn.active { background: rgba(102,136,255,0.35); border-color: #6688ff; color: #adf; }
        hr.divider {
            border: none; border-top: 1px solid rgba(102,136,255,0.12);
            margin: 7px 0;
        }

        /* ── Controls hint ── */
        #controls-hint {
            position: fixed; bottom: 14px; left: 50%;
            transform: translateX(-50%);
            background: rgba(18, 18, 36, 0.75);
            border: 1px solid rgba(102, 136, 255, 0.12);
            border-radius: 20px; padding: 5px 18px;
            font-size: 11px; color: #667;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            white-space: nowrap; pointer-events: none;
        }

        /* ── Error overlay ── */
        #error-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 15, 30, 0.95);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 200; gap: 12px; padding: 24px; text-align: center;
        }
        .error-icon { font-size: 36px; }
        .error-title { font-size: 15px; color: #ff7777; font-weight: 600; }
        .error-msg { font-size: 12px; color: #889; max-width: 360px; line-height: 1.5; }
    `;
  document.head.appendChild(style);
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────
function createLoadingOverlay(): HTMLElement {
  const el = document.createElement("div");
  el.id = "loading-overlay";
  el.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-label" id="loading-label">Loading ${window.plyFileName}…</div>
        <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
    `;
  document.body.appendChild(el);
  return el;
}

function createStatsPanel(): void {
  const panel = document.createElement("div");
  panel.id = "stats-panel";
  panel.innerHTML = `
        <div class="stat-title" id="stat-filename" title="${window.plyFileName}">${window.plyFileName}</div>
        <div class="stat-row"><span class="stat-key">Type</span><span class="stat-val" id="stat-type">—</span></div>
        <div class="stat-row"><span class="stat-key">Vertices</span><span class="stat-val" id="stat-verts">—</span></div>
        <div class="stat-row"><span class="stat-key">Faces</span><span class="stat-val" id="stat-faces">—</span></div>
        <div class="stat-row"><span class="stat-key">Colors</span><span class="stat-val" id="stat-colors">—</span></div>
        <div class="stat-row"><span class="stat-key">Normals</span><span class="stat-val" id="stat-normals">—</span></div>
    `;
  document.body.appendChild(panel);
}

function createSettingsPanel(): void {
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

function createControlsHint(): void {
  const hint = document.createElement("div");
  hint.id = "controls-hint";
  hint.textContent =
    "Drag: look around  ·  Scroll: forward/back  ·  WASD: fly  ·  Space/Shift: up/down  ·  R: reset";
  document.body.appendChild(hint);
}

// ─── PLY Viewer ──────────────────────────────────────────────────────────────
class PlyViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private grid: THREE.GridHelper | null = null;
  private axes: THREE.AxesHelper | null = null;
  private object: THREE.Object3D | null = null;

  private pointMat: THREE.PointsMaterial | null = null;
  private meshMat: THREE.MeshPhongMaterial | null = null;

  private upGroup!: THREE.Group;
  private upAxis = "Y+";

  private savedCamPos = new THREE.Vector3();
  private savedTarget = new THREE.Vector3();
  private maxDim = 1;

  private keys = new Set<string>();

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.upGroup = new THREE.Group();
    this.scene.add(this.upGroup);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.0001,
      1_000_000,
    );
    this.camera.position.set(0, 0, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document
      .getElementById("canvas-container")!
      .appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;

    this.setupLights();
    this.setupHelpers(5);
    this.bindUI();
    this.setupScroll();
    this.onResize();

    window.addEventListener("resize", () => this.onResize());

    this.animate();
    this.load();
  }

  // ── Lighting ──────────────────────────────────────────────────────────
  private setupLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(5, 8, 6);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.25);
    fill.position.set(-5, -4, -6);
    this.scene.add(fill);
  }

  // ── Scene helpers ─────────────────────────────────────────────────────
  private setupHelpers(size: number): void {
    if (this.grid) {
      this.scene.remove(this.grid);
    }
    if (this.axes) {
      this.scene.remove(this.axes);
    }

    this.grid = new THREE.GridHelper(size * 2, 20, 0x4444aa, 0x333366);
    this.scene.add(this.grid);

    this.axes = new THREE.AxesHelper(size * 0.5);
    this.scene.add(this.axes);

    // Sync visibility with current checkbox states (if they exist)
    const gridCb = document.getElementById(
      "grid-toggle",
    ) as HTMLInputElement | null;
    const axesCb = document.getElementById(
      "axes-toggle",
    ) as HTMLInputElement | null;
    if (gridCb) {
      this.grid.visible = gridCb.checked;
    }
    if (axesCb) {
      this.axes.visible = axesCb.checked;
    }
  }

  // ── UI event bindings ─────────────────────────────────────────────────
  private bindUI(): void {
    window.addEventListener("keydown", (e) => {
      // Don't hijack shortcuts with modifiers (Ctrl/Meta) or when typing in an input
      if (e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      this.keys.add(e.code);
      if (e.code === "KeyR") this.resetCamera();
      // Prevent page scroll on Space
      if (e.code === "Space") e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
    });

    document
      .getElementById("btn-reset")
      ?.addEventListener("click", () => this.resetCamera());

    document.getElementById("point-size")?.addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      if (this.pointMat) {
        this.pointMat.size = (v / 1000) * this.maxDim;
        this.pointMat.needsUpdate = true;
      }
    });

    document
      .getElementById("wireframe-toggle")
      ?.addEventListener("change", (e) => {
        if (this.meshMat) {
          this.meshMat.wireframe = (e.target as HTMLInputElement).checked;
        }
      });

    document.getElementById("grid-toggle")?.addEventListener("change", (e) => {
      if (this.grid) {
        this.grid.visible = (e.target as HTMLInputElement).checked;
      }
    });

    document.getElementById("axes-toggle")?.addEventListener("change", (e) => {
      if (this.axes) {
        this.axes.visible = (e.target as HTMLInputElement).checked;
      }
    });

    const bgPalette = [0x1a1a2e, 0x222222, 0x000000, 0xe0e0e0];
    bgPalette.forEach((color, i) => {
      document.getElementById(`bg-${i}`)?.addEventListener("click", () => {
        this.scene.background = new THREE.Color(color);
        document
          .querySelectorAll(".bg-swatch")
          .forEach((s) => s.classList.remove("active"));
        document.getElementById(`bg-${i}`)?.classList.add("active");
      });
    });

    document.querySelectorAll(".axis-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const axis = (btn as HTMLElement).dataset.axis;
        if (axis) this.applyUpAxis(axis);
      });
    });
  }

  // ── Up axis ───────────────────────────────────────────────────────────
  private applyUpAxis(axis: string): void {
    this.upAxis = axis;
    const rotations: Record<string, [number, number, number]> = {
      "Y+": [0, 0, 0],
      "Y-": [Math.PI, 0, 0],
      "Z+": [-Math.PI / 2, 0, 0],
      "Z-": [Math.PI / 2, 0, 0],
      "X+": [0, 0, Math.PI / 2],
      "X-": [0, 0, -Math.PI / 2],
    };
    const [rx, ry, rz] = rotations[axis] ?? [0, 0, 0];
    this.upGroup.rotation.set(rx, ry, rz);

    if (this.grid) {
      const worldBox = new THREE.Box3().setFromObject(this.upGroup);
      this.grid.position.y = worldBox.min.y;
    }

    this.resetCamera();

    document.querySelectorAll(".axis-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        (btn as HTMLElement).dataset.axis === axis,
      );
    });
  }

  // ── Load PLY ─────────────────────────────────────────────────────────
  private load(): void {
    const loader = new PLYLoader();
    loader.load(
      window.plyFileUri,
      (geo) => {
        this.onLoaded(geo);
        this.dismissLoading();
      },
      (progress) => {
        if (progress.lengthComputable && progress.total > 0) {
          const pct = (progress.loaded / progress.total) * 100;
          const fill = document.getElementById("progress-fill");
          if (fill) {
            fill.style.width = `${pct}%`;
          }
        }
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.showError(msg);
      },
    );
  }

  private onLoaded(geo: THREE.BufferGeometry): void {
    geo.computeBoundingBox();
    geo.computeVertexNormals();

    const box = geo.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Translate geometry so its centroid is at origin
    geo.translate(-center.x, -center.y, -center.z);
    box.translate(new THREE.Vector3(-center.x, -center.y, -center.z));

    const size = new THREE.Vector3();
    box.getSize(size);
    this.maxDim = Math.max(size.x, size.y, size.z, 0.0001);

    const hasColor = geo.hasAttribute("color");
    const hasNormal = geo.hasAttribute("normal");
    const hasIndex = geo.index !== null;
    const isMesh = hasIndex;

    let obj: THREE.Object3D;

    if (isMesh) {
      this.meshMat = new THREE.MeshPhongMaterial({
        vertexColors: hasColor,
        color: hasColor ? 0xffffff : 0x7799cc,
        specular: new THREE.Color(0x222222),
        shininess: 40,
        side: THREE.DoubleSide,
      });
      obj = new THREE.Mesh(geo, this.meshMat);
    } else {
      const ptSize = this.maxDim * 0.005;
      this.pointMat = new THREE.PointsMaterial({
        size: ptSize,
        vertexColors: hasColor,
        color: hasColor ? 0xffffff : 0x88aaff,
        sizeAttenuation: true,
      });
      obj = new THREE.Points(geo, this.pointMat);
    }

    this.object = obj;
    this.upGroup.add(obj);

    // Position camera to fit the model
    const fitDist = this.maxDim * 1.8;
    this.camera.position.set(fitDist * 0.7, fitDist * 0.4, fitDist);
    this.camera.lookAt(0, 0, 0);
    this.syncTarget();
    this.camera.near = this.maxDim * 0.0001;
    this.camera.far = this.maxDim * 1000;
    this.camera.updateProjectionMatrix();
    this.controls.update();

    this.savedCamPos.copy(this.camera.position);
    this.savedTarget.copy(this.controls.target);

    // Rebuild helpers scaled to the model
    this.setupHelpers(this.maxDim);
    if (this.grid) {
      const worldBox = new THREE.Box3().setFromObject(this.upGroup);
      this.grid.position.y = worldBox.min.y;
    }

    // Show/hide per-mode settings
    const rowPoint = document.getElementById("row-point-size");
    const rowWire = document.getElementById("row-wireframe");
    if (rowPoint) {
      rowPoint.style.display = isMesh ? "none" : "flex";
    }
    if (rowWire) {
      rowWire.style.display = isMesh ? "flex" : "none";
    }

    // Update stats
    const verts = geo.attributes.position.count;
    const faces = hasIndex ? geo.index!.count / 3 : 0;
    this.setStats(
      isMesh ? "Mesh" : "Point Cloud",
      verts,
      faces,
      hasColor,
      hasNormal,
    );
  }

  private setStats(
    type: string,
    verts: number,
    faces: number,
    colors: boolean,
    normals: boolean,
  ): void {
    const fmt = (n: number) => n.toLocaleString();
    const set = (id: string, v: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = v;
      }
    };
    set("stat-type", type);
    set("stat-verts", fmt(verts));
    set("stat-faces", faces > 0 ? fmt(faces) : "—");
    set("stat-colors", colors ? "Yes" : "No");
    set("stat-normals", normals ? "Yes" : "Computed");
  }

  private dismissLoading(): void {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) {
      return;
    }
    overlay.classList.add("fade-out");
    setTimeout(() => overlay.remove(), 450);
  }

  private showError(message: string): void {
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

  // ── Camera ────────────────────────────────────────────────────────────
  private syncTarget(): void {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.controls.target.copy(this.camera.position).addScaledVector(dir, 0.01);
  }

  private resetCamera(): void {
    this.camera.position.copy(this.savedCamPos);
    this.controls.target.copy(this.savedTarget);
    this.controls.update();
  }

  // ── Scroll for forward/back ───────────────────────────────────────────
  private setupScroll(): void {
    this.renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const speed = this.maxDim * 0.05;
        const delta = e.deltaY > 0 ? -speed : speed;
        this.camera.position.addScaledVector(dir, delta);
        this.syncTarget();
      },
      { passive: false },
    );
  }

  // ── Resize ────────────────────────────────────────────────────────────
  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ── WASD fly movement ────────────────────────────────────────────────
  private applyKeyMovement(): void {
    const k = this.keys;
    if (!k.size) return;

    const speed = this.maxDim * 0.01;

    // Forward/back along camera look direction (projected flat)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    // Right = cross(forward, worldUp)
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3()
      .crossVectors(forward, worldUp)
      .normalize();

    const delta = new THREE.Vector3();

    if (k.has("KeyW")) delta.addScaledVector(forward, speed);
    if (k.has("KeyS")) delta.addScaledVector(forward, -speed);
    if (k.has("KeyA")) delta.addScaledVector(right, -speed);
    if (k.has("KeyD")) delta.addScaledVector(right, speed);
    if (k.has("Space")) delta.y += speed;
    if (k.has("ShiftLeft") || k.has("ShiftRight")) delta.y -= speed;

    if (delta.lengthSq() === 0) return;

    this.camera.position.add(delta);
    this.syncTarget();
  }

  // ── Render loop ───────────────────────────────────────────────────────
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.applyKeyMovement();
    this.controls.update();
    // Keep target synced after orbit rotation
    this.syncTarget();
    this.renderer.render(this.scene, this.camera);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
injectStyles();
createLoadingOverlay();
createStatsPanel();
createSettingsPanel();
createControlsHint();
new PlyViewer();
