// src/fileWatcher.ts
import * as vscode from 'vscode';
import { RulesConverter } from './rulesConverter';

export class FileWatcher implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private isWatching: boolean = false;

    constructor(private converter: RulesConverter) {}

    startWatching(): void {
        if (this.isWatching) {
            vscode.window.showInformationMessage('ファイル監視は既に開始されております、お嬢様');
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showWarningMessage('ワークスペースが開かれていないため、ファイル監視を開始できません');
            return;
        }

        // ...existing code...

        // Cursor Rulesの監視
        const cursorWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '.cursor/rules/**/*.mdc')
        );

        cursorWatcher.onDidChange(async (uri) => {
            try {
                await this.converter.convertCursorToVSCode(uri);
                const fileName = uri.fsPath.split('/').pop();
                vscode.window.showInformationMessage(`🔄 ${fileName} を自動変換いたしました、お嬢様`);
            } catch (error) {
                vscode.window.showErrorMessage(`Cursor Rules自動変換エラー: ${error}`);
            }
        });

        cursorWatcher.onDidCreate(async (uri) => {
            try {
                await this.converter.convertCursorToVSCode(uri);
                const fileName = uri.fsPath.split('/').pop();
                vscode.window.showInformationMessage(`✨ 新しいCursor Rule ${fileName} を変換いたしました、お嬢様`);
            } catch (error) {
                vscode.window.showErrorMessage(`Cursor Rules変換エラー: ${error}`);
            }
        });

        // VSCode Instructionsの監視
        const vscodeWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '.github/instructions/**/*.instructions.md')
        );

        vscodeWatcher.onDidChange(async (uri) => {
            try {
                await this.converter.convertVSCodeToCursor(uri);
                const fileName = uri.fsPath.split('/').pop();
                vscode.window.showInformationMessage(`🔄 ${fileName} を自動変換いたしました、お嬢様`);
            } catch (error) {
                vscode.window.showErrorMessage(`VSCode Instructions自動変換エラー: ${error}`);
            }
        });

        vscodeWatcher.onDidCreate(async (uri) => {
            try {
                await this.converter.convertVSCodeToCursor(uri);
                const fileName = uri.fsPath.split('/').pop();
                vscode.window.showInformationMessage(`✨ 新しいVSCode Instruction ${fileName} を変換いたしました、お嬢様`);
            } catch (error) {
                vscode.window.showErrorMessage(`VSCode Instructions変換エラー: ${error}`);
            }
        });

        this.disposables.push(cursorWatcher, vscodeWatcher);
        this.isWatching = true;
        vscode.window.showInformationMessage('📁 ファイル監視を開始いたしました、お嬢様');
    }

    stopWatching(): void {
        if (!this.isWatching) {
            vscode.window.showInformationMessage('ファイル監視は既に停止されております、お嬢様');
            return;
        }

        this.dispose();
        this.isWatching = false;
        vscode.window.showInformationMessage('📁 ファイル監視を停止いたしました、お嬢様');
    }

    getWatchingStatus(): boolean {
        return this.isWatching;
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.isWatching = false;
    }
}