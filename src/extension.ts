import * as vscode from "vscode";
import { PlyEditorProvider } from "./plyEditorProvider";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(PlyEditorProvider.register(context));
}

export function deactivate(): void {}
