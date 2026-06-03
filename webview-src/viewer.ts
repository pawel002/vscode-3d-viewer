import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadPly, LoadedModel } from "./loader";
import { injectStyles } from "./styles";
import {
  createLoadingOverlay,
  dismissLoading,
  showError,
  createStatsPanel,
  updateStats,
  updateStatsFilename,
  setLoadingProgress,
  showLoadingOverlay,
  createSettingsPanel,
  createControlsHint,
  createFileBrowser,
} from "./ui";

declare global {
  interface Window {
    plyFileUri: string;
    plyFileName: string;
    plySiblingNames: string[];
    plySiblingUris: string[];
  }
}

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
  private isLoading = false;

  private siblingNames: string[];
  private siblingUris: string[];
  private currentIndex: number;

  constructor() {
    this.siblingNames = window.plySiblingNames ?? [];
    this.siblingUris = window.plySiblingUris ?? [];
    this.currentIndex = Math.max(0, this.siblingNames.indexOf(window.plyFileName));

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
    this.loadFile(this.currentIndex, false);
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
    if (this.grid) this.scene.remove(this.grid);
    if (this.axes) this.scene.remove(this.axes);

    this.grid = new THREE.GridHelper(size * 2, 20, 0x4444aa, 0x333366);
    this.scene.add(this.grid);

    this.axes = new THREE.AxesHelper(size * 0.5);
    this.scene.add(this.axes);

    const gridCb = document.getElementById("grid-toggle") as HTMLInputElement | null;
    const axesCb = document.getElementById("axes-toggle") as HTMLInputElement | null;
    if (gridCb) this.grid.visible = gridCb.checked;
    if (axesCb) this.axes.visible = axesCb.checked;
  }

  // ── UI event bindings ─────────────────────────────────────────────────
  private bindUI(): void {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      this.keys.add(e.code);
      if (e.code === "KeyR") this.resetCamera();
      if (e.code === "Space") e.preventDefault();
      if (e.code === "ArrowLeft") { e.preventDefault(); this.navigate(-1); }
      if (e.code === "ArrowRight") { e.preventDefault(); this.navigate(1); }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    document.getElementById("btn-reset")?.addEventListener("click", () => this.resetCamera());

    document.getElementById("point-size")?.addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      if (this.pointMat) {
        this.pointMat.size = (v / 1000) * this.maxDim;
        this.pointMat.needsUpdate = true;
      }
    });

    document.getElementById("wireframe-toggle")?.addEventListener("change", (e) => {
      if (this.meshMat) this.meshMat.wireframe = (e.target as HTMLInputElement).checked;
    });

    document.getElementById("grid-toggle")?.addEventListener("change", (e) => {
      if (this.grid) this.grid.visible = (e.target as HTMLInputElement).checked;
    });

    document.getElementById("axes-toggle")?.addEventListener("change", (e) => {
      if (this.axes) this.axes.visible = (e.target as HTMLInputElement).checked;
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

  // ── File navigation ───────────────────────────────────────────────────
  private navigate(delta: number): void {
    const next = this.currentIndex + delta;
    if (next < 0 || next >= this.siblingUris.length) return;
    this.loadFile(next, true);
  }

  private loadFile(index: number, preserveCamera: boolean): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.currentIndex = index;

    const uri = this.siblingUris.length > 0 ? this.siblingUris[index] : window.plyFileUri;
    const name = this.siblingNames.length > 0 ? this.siblingNames[index] : window.plyFileName;

    showLoadingOverlay(name);
    createFileBrowser(this.siblingNames, index, (i) => this.loadFile(i, true));

    if (this.object) {
      this.upGroup.remove(this.object);
      const geo = (this.object as THREE.Points | THREE.Mesh).geometry;
      if (geo) geo.dispose();
      this.object = null;
    }
    if (this.pointMat) { this.pointMat.dispose(); this.pointMat = null; }
    if (this.meshMat) { this.meshMat.dispose(); this.meshMat = null; }

    loadPly(
      uri,
      (pct) => setLoadingProgress(pct),
      (model) => {
        this.onLoaded(model, preserveCamera);
        dismissLoading();
        this.isLoading = false;
        createFileBrowser(this.siblingNames, this.currentIndex, (i) => this.loadFile(i, true));
      },
      (msg) => {
        showError(msg);
        this.isLoading = false;
      },
    );
  }

  // ── Post-load setup ───────────────────────────────────────────────────
  private onLoaded(model: LoadedModel, preserveCamera: boolean): void {
    this.maxDim = model.maxDim;
    this.pointMat = model.pointMat;
    this.meshMat = model.meshMat;
    this.object = model.object;
    this.upGroup.add(model.object);

    const fitDist = this.maxDim * 1.8;

    if (!preserveCamera) {
      this.camera.position.set(fitDist * 0.7, fitDist * 0.4, fitDist);
      this.camera.lookAt(0, 0, 0);
      this.syncTarget();
    }

    this.camera.near = this.maxDim * 0.0001;
    this.camera.far = this.maxDim * 1000;
    this.camera.updateProjectionMatrix();
    this.controls.update();

    // "Reset Camera" always snaps to the default view for the current file
    this.savedCamPos.set(fitDist * 0.7, fitDist * 0.4, fitDist);
    this.savedTarget.set(0, 0, 0);

    this.setupHelpers(this.maxDim);

    // Re-apply up axis rotation without moving the camera
    const [rx, ry, rz] = upAxisRotation(this.upAxis);
    this.upGroup.rotation.set(rx, ry, rz);

    if (this.grid) {
      const worldBox = new THREE.Box3().setFromObject(this.upGroup);
      this.grid.position.y = worldBox.min.y;
    }

    // Restore point size from slider (relative to new maxDim)
    if (this.pointMat) {
      const slider = document.getElementById("point-size") as HTMLInputElement | null;
      const v = slider ? Number(slider.value) : 5;
      this.pointMat.size = (v / 1000) * this.maxDim;
    }

    // Restore wireframe state on the new material
    if (this.meshMat) {
      const wireframeCb = document.getElementById("wireframe-toggle") as HTMLInputElement | null;
      if (wireframeCb) this.meshMat.wireframe = wireframeCb.checked;
    }

    // Show/hide mode-specific controls
    const rowPoint = document.getElementById("row-point-size");
    const rowWire = document.getElementById("row-wireframe");
    if (rowPoint) rowPoint.style.display = model.isMesh ? "none" : "flex";
    if (rowWire) rowWire.style.display = model.isMesh ? "flex" : "none";

    const name = this.siblingNames[this.currentIndex] ?? window.plyFileName;
    updateStatsFilename(name);
    updateStats(
      model.isMesh ? "Mesh" : "Point Cloud",
      model.vertexCount,
      model.faceCount,
      model.hasColor,
      model.hasNormal,
    );
  }

  // ── Up axis ───────────────────────────────────────────────────────────
  private applyUpAxis(axis: string): void {
    this.upAxis = axis;
    const [rx, ry, rz] = upAxisRotation(axis);
    this.upGroup.rotation.set(rx, ry, rz);

    if (this.grid) {
      const worldBox = new THREE.Box3().setFromObject(this.upGroup);
      this.grid.position.y = worldBox.min.y;
    }

    this.resetCamera();

    document.querySelectorAll(".axis-btn").forEach((btn) => {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.axis === axis);
    });
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
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
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
    this.syncTarget();
    this.renderer.render(this.scene, this.camera);
  }
}

function upAxisRotation(axis: string): [number, number, number] {
  const rotations: Record<string, [number, number, number]> = {
    "Y+": [0, 0, 0],
    "Y-": [Math.PI, 0, 0],
    "Z+": [-Math.PI / 2, 0, 0],
    "Z-": [Math.PI / 2, 0, 0],
    "X+": [0, 0, Math.PI / 2],
    "X-": [0, 0, -Math.PI / 2],
  };
  return rotations[axis] ?? [0, 0, 0];
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
injectStyles();
createLoadingOverlay(window.plyFileName);
createStatsPanel(window.plyFileName);
createSettingsPanel();
createControlsHint();
new PlyViewer();
