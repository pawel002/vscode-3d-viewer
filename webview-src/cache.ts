import * as THREE from "three";
import { loadPly, LoadedModel } from "./loader";

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

interface CacheEntry {
  mtime: number;
  model: LoadedModel;
}

const MAX_ENTRIES = 100;
const entries = new Map<string, CacheEntry>();

// Initialised once; calling acquireVsCodeApi() more than once throws.
const vscodeApi = acquireVsCodeApi();

// ── Public accessors ─────────────────────────────────────────────────────────

export function isReady(uri: string): boolean {
  return entries.has(uri);
}

export function getModel(uri: string): LoadedModel | undefined {
  return entries.get(uri)?.model;
}

export function getCachedMtime(uri: string): number | undefined {
  return entries.get(uri)?.mtime;
}

export function store(uri: string, mtime: number, model: LoadedModel): void {
  const existing = entries.get(uri);
  if (existing) {
    if (existing.model !== model) disposeModel(existing.model);
    entries.delete(uri);
  }
  if (entries.size >= MAX_ENTRIES) {
    // Evict the oldest entry (Map preserves insertion order)
    const oldest = entries.keys().next().value!;
    evict(oldest);
  }
  entries.set(uri, { mtime, model });
}

export function evict(uri: string): void {
  const entry = entries.get(uri);
  if (entry) {
    disposeModel(entry.model);
    entries.delete(uri);
  }
}

function disposeModel(model: LoadedModel): void {
  const obj = model.object as THREE.Mesh | THREE.Points;
  (obj.geometry as THREE.BufferGeometry)?.dispose();
  model.pointMat?.dispose();
  model.meshMat?.dispose();
}

// ── Prefetch queue (one file at a time in the background) ────────────────────

export interface PrefetchItem {
  uri: string;
  fsPath: string;
  mtime: number;
}

let prefetchQueue: PrefetchItem[] = [];
let prefetchActive = false;

export function schedulePrefetch(items: PrefetchItem[]): void {
  // Drop items that are already cached and current
  prefetchQueue = items.filter(
    (it) => !entries.has(it.uri) || entries.get(it.uri)!.mtime !== it.mtime,
  );
  if (!prefetchActive) advance();
}

function advance(): void {
  if (prefetchQueue.length === 0) {
    prefetchActive = false;
    return;
  }
  prefetchActive = true;
  const item = prefetchQueue.shift()!;

  // May have been cached while waiting in queue
  if (entries.has(item.uri) && entries.get(item.uri)!.mtime === item.mtime) {
    advance();
    return;
  }

  loadPly(
    item.uri,
    () => {},
    (model) => {
      store(item.uri, item.mtime, model);
      advance();
    },
    () => advance(),
  );
}

// ── Mtime checking via VS Code message passing ───────────────────────────────

// Multiple callers can queue up for the same path; they all get notified.
const mtimeCallbacks = new Map<string, Array<(mtime: number | null) => void>>();

window.addEventListener("message", (event: MessageEvent) => {
  const msg = event.data as {
    type: string;
    data: Record<string, number | null>;
  };
  if (msg.type !== "mtimes") return;
  for (const [fsPath, mtime] of Object.entries(msg.data)) {
    const cbs = mtimeCallbacks.get(fsPath);
    if (cbs) {
      mtimeCallbacks.delete(fsPath);
      cbs.forEach((cb) => cb(mtime));
    }
  }
});

export function checkMtime(
  fsPath: string,
  callback: (mtime: number | null) => void,
): void {
  const existing = mtimeCallbacks.get(fsPath);
  if (existing) {
    // A request is already in-flight for this path — piggyback on it
    existing.push(callback);
  } else {
    mtimeCallbacks.set(fsPath, [callback]);
    vscodeApi.postMessage({ type: "getMtimes", paths: [fsPath] });
  }
}
