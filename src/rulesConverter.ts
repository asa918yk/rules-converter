// src/rulesConverter.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

interface CursorRule {
    type: string;
    description: string;
    globs: string[];
    content: string;
}

interface VSCodeInstruction {
    applyTo: string;
    description: string;
    content: string;
}

export class RulesConverter {
    private workspaceRoot: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async convertCursorToVSCode(uri: vscode.Uri): Promise<void> {
        try {
            if (!uri || !uri.scheme) {
                throw new Error('有効なファイルURIが提供されておりません、お嬢様');
            }
            
            const content = await vscode.workspace.fs.readFile(uri);
            const cursorRule = this.parseCursorRule(content.toString());
            
            const vscodeInstruction = this.mapCursorToVSCode(cursorRule);
            const outputPath = this.getVSCodeInstructionPath(uri);
            
            // ディレクトリを確実に作成
            await this.ensureDirectoryExists(path.dirname(outputPath));
            await this.writeVSCodeInstruction(outputPath, vscodeInstruction);
        } catch (error) {
            throw new Error(`Cursor Rules変換エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async convertVSCodeToCursor(uri: vscode.Uri): Promise<void> {
        try {
            if (!uri || !uri.scheme) {
                throw new Error('有効なファイルURIが提供されておりません、お嬢様');
            }
            
            const content = await vscode.workspace.fs.readFile(uri);
            const vscodeInstruction = this.parseVSCodeInstruction(content.toString());
            
            const cursorRule = this.mapVSCodeToCursor(vscodeInstruction);
            const outputPath = this.getCursorRulePath(uri);
            
            // ディレクトリを確実に作成
            await this.ensureDirectoryExists(path.dirname(outputPath));
            await this.writeCursorRule(outputPath, cursorRule);
        } catch (error) {
            throw new Error(`VSCode Instructions変換エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
        } catch {
            // ディレクトリが存在しない場合は作成
            try {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
            } catch (error) {
                // 親ディレクトリが存在しない場合は再帰的に作成
                const parentDir = path.dirname(dirPath);
                if (parentDir !== dirPath) {
                    await this.ensureDirectoryExists(parentDir);
                    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
                }
            }
        }
    }

    private parseCursorRule(content: string): CursorRule {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        
        if (frontMatterMatch) {
            const frontMatter = yamlParse(frontMatterMatch[1]) as any;
            const body = frontMatterMatch[2];
            
            return {
                type: frontMatter.type || 'Always',
                description: frontMatter.description || '',
                globs: frontMatter.globs || [],
                content: body.trim()
            };
        }
        
        return {
            type: 'Always',
            description: '',
            globs: [],
            content: content.trim()
        };
    }

    private parseVSCodeInstruction(content: string): VSCodeInstruction {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        
        if (frontMatterMatch) {
            const frontMatter = yamlParse(frontMatterMatch[1]) as any;
            const body = frontMatterMatch[2];
            
            return {
                applyTo: frontMatter.applyTo || '**',
                description: frontMatter.description || '',
                content: body.trim()
            };
        }
        
        return {
            applyTo: '**',
            description: '',
            content: content.trim()
        };
    }

    private mapCursorToVSCode(cursorRule: CursorRule): VSCodeInstruction {
        let applyTo = '**';
        
        switch (cursorRule.type) {
            case 'Always':
                applyTo = '**';
                break;
            case 'Auto Attached':
                applyTo = cursorRule.globs.join(',') || '**';
                break;
            case 'Manual':
                applyTo = '**'; // 手動呼び出し用は全体に適用
                break;
            default:
                applyTo = '**';
        }

        return {
            applyTo,
            description: cursorRule.description,
            content: cursorRule.content
        };
    }

    private mapVSCodeToCursor(vscodeInstruction: VSCodeInstruction): CursorRule {
        let type: string;
        let globs: string[] = [];

        if (vscodeInstruction.applyTo === '**') {
            type = 'Always';
        } else {
            type = 'Auto Attached';
            globs = vscodeInstruction.applyTo.split(',').map(g => g.trim());
        }

        return {
            type,
            description: vscodeInstruction.description,
            globs,
            content: vscodeInstruction.content
        };
    }

    private getVSCodeInstructionPath(cursorRulePath: vscode.Uri): string {
        const basename = path.basename(cursorRulePath.fsPath, '.mdc');
        return path.join(this.workspaceRoot, '.github', 'instructions', `${basename}.instructions.md`);
    }

    private getCursorRulePath(vscodeInstructionPath: vscode.Uri): string {
        const basename = path.basename(vscodeInstructionPath.fsPath).replace('.instructions.md', '');
        return path.join(this.workspaceRoot, '.cursor', 'rules', `${basename}.mdc`);
    }

    async syncAll(): Promise<void> {
        const cursorRulesPattern = new vscode.RelativePattern(this.workspaceRoot, '.cursor/rules/**/*.mdc');
        const vscodeInstructionsPattern = new vscode.RelativePattern(this.workspaceRoot, '.github/instructions/**/*.instructions.md');

        const [cursorFiles, vscodeFiles] = await Promise.all([
            vscode.workspace.findFiles(cursorRulesPattern),
            vscode.workspace.findFiles(vscodeInstructionsPattern)
        ]);

        // Cursor Rules → VSCode Instructions
        for (const file of cursorFiles) {
            await this.convertCursorToVSCode(file);
        }

        // VSCode Instructions → Cursor Rules (newer files only)
        for (const file of vscodeFiles) {
            const cursorPath = this.getCursorRulePath(file);
            const cursorExists = await this.fileExists(cursorPath);
            
            if (!cursorExists) {
                await this.convertVSCodeToCursor(file);
            }
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        } catch {
            return false;
        }
    }

    private async writeVSCodeInstruction(filePath: string, instruction: VSCodeInstruction): Promise<void> {
        const frontMatterObj: any = {
            applyTo: instruction.applyTo
        };

        // descriptionが空でない場合のみ追加
        if (instruction.description && instruction.description.trim() !== '') {
            frontMatterObj.description = instruction.description;
        }

        let frontMatter = yamlStringify(frontMatterObj, {
            defaultStringType: 'PLAIN'
        });

        // descriptionフィールドのみ引用符で囲む（存在する場合）
        if (frontMatterObj.description) {
            frontMatter = frontMatter.replace(/^description:\s*(.+)$/m, 'description: "$1"');
        }

        const content = `---\n${frontMatter}---\n\n${instruction.content}`;
        
        // TextEncoderを使用してBuffer()を避ける
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            data
        );
    }

    private async writeCursorRule(filePath: string, rule: CursorRule): Promise<void> {
        const frontMatter: any = {
            type: rule.type
        };

        // descriptionが空でない場合のみ追加
        if (rule.description && rule.description.trim() !== '') {
            frontMatter.description = rule.description;
        }

        if (rule.globs.length > 0) {
            frontMatter.globs = rule.globs;
        }

        // YAMLを生成
        let frontMatterYaml = yamlStringify(frontMatter);
        
        // globsフィールドを配列形式 ["*.test.ts", "*.spec.ts"] に強制変換
        if (rule.globs.length > 0) {
            const globsJsonArray = JSON.stringify(rule.globs);
            frontMatterYaml = frontMatterYaml.replace(
                /globs:\s*\n(?:\s*-\s*.+\n?)*/,
                `globs: ${globsJsonArray}`
            );
        }
        
        // descriptionフィールドのみクォートを追加（存在する場合）
        if (frontMatter.description) {
            frontMatterYaml = frontMatterYaml.replace(/^description:\s*(.+)$/m, 'description: "$1"');
        }
        
        // YAMLの末尾の余分な改行を削除して確実に改行を制御
        frontMatterYaml = frontMatterYaml.trim();
        
        const content = `---\n${frontMatterYaml}\n---\n\n${rule.content}`;
        
        // TextEncoderを使用してBuffer()を避ける
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            data
        );
    }
}