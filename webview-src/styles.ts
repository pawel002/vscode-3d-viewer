export function injectStyles(): void {
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
      z-index: 200; transition: opacity 0.4s ease;
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
      border-radius: 2px; transition: width 0.25s ease; width: 0%;
    }

    /* ── Stats panel ── */
    #stats-panel {
      position: fixed; top: 12px; right: 12px;
      background: rgba(18, 18, 36, 0.82);
      border: 1px solid rgba(102, 136, 255, 0.2);
      border-radius: 8px; padding: 10px 14px;
      font-size: 12px; min-width: 170px;
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    }
    .stat-title {
      font-size: 11px; font-weight: 600;
      color: #6688ff; letter-spacing: 0.06em;
      text-transform: uppercase; margin-bottom: 7px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 160px;
    }
    .stat-row { display: flex; justify-content: space-between; gap: 10px; margin: 3px 0; }
    .stat-key { color: #778; font-size: 11px; }
    .stat-val { color: #adf; font-size: 11px; font-weight: 500; }

    /* ── Settings panel ── */
    #settings-panel {
      position: fixed; top: 12px; left: 12px;
      background: rgba(18, 18, 36, 0.82);
      border: 1px solid rgba(102, 136, 255, 0.2);
      border-radius: 8px; padding: 10px 14px;
      font-size: 12px; min-width: 175px;
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    }
    .panel-title {
      font-size: 11px; font-weight: 600; color: #6688ff;
      letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 9px;
    }
    .setting-row {
      display: flex; align-items: center;
      justify-content: space-between; gap: 8px; margin: 5px 0;
    }
    .setting-label { color: #889; font-size: 11px; flex-shrink: 0; }
    input[type="range"] { width: 78px; accent-color: #6688ff; cursor: pointer; background: transparent; }
    input[type="checkbox"] { accent-color: #6688ff; cursor: pointer; }
    .bg-swatches { display: flex; gap: 5px; }
    .bg-swatch {
      width: 18px; height: 18px; border-radius: 4px;
      border: 1.5px solid rgba(255,255,255,0.15);
      cursor: pointer; transition: transform 0.1s, border-color 0.1s; flex-shrink: 0;
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
    .setting-col { display: flex; flex-direction: column; gap: 4px; margin: 5px 0; }
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
    hr.divider { border: none; border-top: 1px solid rgba(102,136,255,0.12); margin: 7px 0; }

    /* ── File browser ── */
    #file-browser {
      position: fixed; bottom: 50px; left: 50%;
      transform: translateX(-50%);
      background: rgba(18, 18, 36, 0.88);
      border: 1px solid rgba(102, 136, 255, 0.2);
      border-radius: 20px; padding: 5px 8px;
      display: flex; align-items: center; gap: 6px;
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      max-width: 80vw; overflow: hidden;
    }
    .fb-btn {
      background: rgba(102,136,255,0.1);
      border: 1px solid rgba(102,136,255,0.25);
      color: #aac; border-radius: 14px;
      padding: 3px 10px; font-size: 11px;
      cursor: pointer; transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
    }
    .fb-btn:hover { background: rgba(102,136,255,0.28); }
    .fb-btn:disabled { opacity: 0.3; cursor: default; }
    .fb-list {
      display: flex; gap: 4px; overflow-x: auto;
      scrollbar-width: none; -ms-overflow-style: none;
    }
    .fb-list::-webkit-scrollbar { display: none; }
    .fb-file {
      padding: 3px 10px; font-size: 11px;
      background: rgba(102,136,255,0.08);
      border: 1px solid rgba(102,136,255,0.15);
      color: #99a; border-radius: 14px;
      cursor: pointer; white-space: nowrap;
      transition: background 0.15s, border-color 0.15s;
    }
    .fb-file:hover { background: rgba(102,136,255,0.22); }
    .fb-file.active { background: rgba(102,136,255,0.35); border-color: #6688ff; color: #adf; }

    /* ── Controls hint ── */
    #controls-hint {
      position: fixed; bottom: 14px; left: 50%;
      transform: translateX(-50%);
      background: rgba(18, 18, 36, 0.75);
      border: 1px solid rgba(102, 136, 255, 0.12);
      border-radius: 20px; padding: 5px 18px;
      font-size: 11px; color: #667;
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
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
