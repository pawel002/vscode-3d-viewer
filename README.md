# PLY Viewer

Interactive 3D point cloud and mesh viewer for `.ply` files, built as a native VS Code extension.

![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.74.0-blue)

## Features

- Renders `.ply` point clouds and meshes directly in the editor
- Orbit, fly (WASD), and scroll navigation
- Settings panel: point size, wireframe, grid, axes, up-axis, background colour
- Stats panel: vertex/face count, colour and normal presence
- **File browser bar** — when multiple `.ply` files share a directory, jump between them with the prev/next buttons or the ← → arrow keys while keeping the camera position and all settings intact
- **Client-side caching** — sibling files are pre-loaded in the background (closest neighbours first); switching to an already-cached file is instant. Cached entries are invalidated by file modification time and reloaded silently without freezing the UI
- **Preserved coordinate space** — geometry is rendered in its original coordinate system, so consecutive point clouds from the same scene stay spatially aligned when flipping between frames

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org) | 18 or later |
| [VS Code](https://code.visualstudio.com) | 1.74 or later |

## Development setup

```bash
git clone <repo-url>
cd ply-viewer
npm install
npm run compile        # one-off build
# or
npm run watch          # rebuild on every file change
```

Then press **F5** in VS Code to open an Extension Development Host with the extension loaded. Open any `.ply` file to try it.

## Install from VSIX

Build the package:

```bash
npm install -g @vscode/vsce   # install the VS Code packaging tool (once)
vsce package                  # produces ply-viewer-<version>.vsix
```

Install it in VS Code:

```bash
code --install-extension ply-viewer-<version>.vsix
```

Or via the UI: **Extensions → ⋯ → Install from VSIX…** and pick the generated file.

## Controls

| Input | Action |
|-------|--------|
| Left-drag | Orbit |
| Scroll | Move forward / back |
| W A S D | Fly |
| Space / Shift | Move up / down |
| ← → | Previous / next file in folder |
| R | Reset camera |

## Project structure

```
src/
  extension.ts          VS Code activation entry point
  plyEditorProvider.ts  Custom editor provider (reads directory siblings, serves mtime queries)
webview-src/
  viewer.ts             Three.js scene, camera, render loop, navigation
  loader.ts             PLY loading and geometry processing
  cache.ts              LRU model cache, background prefetch queue, mtime checking
  ui.ts                 DOM helpers (panels, file browser, overlays)
  styles.ts             Injected CSS
media/
  viewer.js             Compiled webview bundle (generated)
dist/
  extension.js          Compiled extension bundle (generated)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Build both bundles (development mode) |
| `npm run watch` | Watch and rebuild on changes |
| `npm run package` | Production build (minified, no source maps) |
