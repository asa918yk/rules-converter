// src/extension.ts
import * as vscode from 'vscode';
import { RulesConverter } from './rulesConverter';
import { FileWatcher } from './fileWatcher';

export function activate(context: vscode.ExtensionContext) {
    const converter = new RulesConverter();
    const watcher = new FileWatcher(converter);

    // コマンドの登録
    const convertCursorToVSCode = vscode.commands.registerCommand(
        'rules-converter.convertCursorToVSCode',
        async (uri?: vscode.Uri) => {
            try {
                if (!uri) {
                    // URIが渡されていない場合は、アクティブなエディタから取得
                    const activeEditor = vscode.window.activeTextEditor;
                    if (!activeEditor) {
                        vscode.window.showErrorMessage('ファイルが選択されておりません、お嬢様');
                        return;
                    }
                    uri = activeEditor.document.uri;
                }
                
                // .mdcファイルかチェック
                if (!uri.fsPath.endsWith('.mdc')) {
                    vscode.window.showErrorMessage('Cursor Rules (.mdc) ファイルを選択してください、お嬢様');
                    return;
                }
                
                await converter.convertCursorToVSCode(uri);
                vscode.window.showInformationMessage('✨ Cursor Rules → VSCode Instructions 変換完了でございます、お嬢様');
            } catch (error) {
                vscode.window.showErrorMessage(`変換中にエラーが発生いたしました: ${error}`);
            }
        }
    );

    const convertVSCodeToCursor = vscode.commands.registerCommand(
        'rules-converter.convertVSCodeToCursor',
        async (uri?: vscode.Uri) => {
            try {
                if (!uri) {
                    // URIが渡されていない場合は、アクティブなエディタから取得
                    const activeEditor = vscode.window.activeTextEditor;
                    if (!activeEditor) {
                        vscode.window.showErrorMessage('ファイルが選択されておりません、お嬢様');
                        return;
                    }
                    uri = activeEditor.document.uri;
                }
                
                // .instructions.mdファイルかチェック
                if (!uri.fsPath.includes('.instructions.md')) {
                    vscode.window.showErrorMessage('VSCode Instructions (.instructions.md) ファイルを選択してください、お嬢様');
                    return;
                }
                
                await converter.convertVSCodeToCursor(uri);
                vscode.window.showInformationMessage('✨ VSCode Instructions → Cursor Rules 変換完了でございます、お嬢様');
            } catch (error) {
                vscode.window.showErrorMessage(`変換中にエラーが発生いたしました: ${error}`);
            }
        }
    );

    const syncRules = vscode.commands.registerCommand(
        'rules-converter.syncRules',
        async () => {
            try {
                await converter.syncAll();
                vscode.window.showInformationMessage('🔄 双方向同期が完了いたしました、お嬢様');
            } catch (error) {
                vscode.window.showErrorMessage(`同期中にエラーが発生いたしました: ${error}`);
            }
        }
    );

    const startWatching = vscode.commands.registerCommand(
        'rules-converter.startWatching',
        () => {
            watcher.startWatching();
        }
    );

    const stopWatching = vscode.commands.registerCommand(
        'rules-converter.stopWatching',
        () => {
            watcher.stopWatching();
        }
    );

    // 設定に基づいてファイル監視を開始
    const config = vscode.workspace.getConfiguration('rulesConverter');
    const autoWatch = config.get<boolean>('autoWatch', false);
    
    if (autoWatch) {
        watcher.startWatching();
    }

    context.subscriptions.push(
        convertCursorToVSCode,
        convertVSCodeToCursor,
        syncRules,
        startWatching,
        stopWatching,
        watcher
    );
}

export function deactivate() {}