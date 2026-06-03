import * as vscode from "vscode";
import * as path from "path";

export class PlyEditorProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = "plyViewer.plyEditor";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      PlyEditorProvider.viewType,
      new PlyEditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      },
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CustomDocument> {
    return { uri, dispose: () => {} };
  }

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    // Allow the webview to access the media folder (for viewer.js)
    // and the directory that contains the .ply file (to load it via fetch).
    const fileDir = vscode.Uri.file(path.dirname(document.uri.fsPath));

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
        fileDir,
      ],
    };

    const fileUri = webviewPanel.webview.asWebviewUri(document.uri);
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      fileUri,
      document.uri,
    );
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    fileUri: vscode.Uri,
    originalUri: vscode.Uri,
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "viewer.js"),
    );

    const nonce = getNonce();
    const filename = path.basename(originalUri.fsPath);

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   script-src 'nonce-${nonce}';
                   style-src 'unsafe-inline';
                   connect-src ${webview.cspSource};
                   img-src ${webview.cspSource} data:;">
    <title>${filename}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
        #canvas-container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    <script nonce="${nonce}">
        window.plyFileUri = ${JSON.stringify(fileUri.toString())};
        window.plyFileName = ${JSON.stringify(filename)};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
