# Rules Converter - Cursor ⇄ VSCode Instructions 変換拡張機能

お嬢様、この拡張機能はCursor RulesとVSCode Custom Instructionsを相互に変換するために開発された、執事のような丁寧なツールでございます。

## 🎯 機能

### ✨ 主要機能
- **Cursor Rules → VSCode Instructions**: `.mdc`ファイルを`.instructions.md`に変換
- **VSCode Instructions → Cursor Rules**: `.instructions.md`ファイルを`.mdc`に変換
- **自動監視**: ファイルの変更を検知して自動変換（設定で有効/無効切り替え可能）
- **双方向同期**: 全ファイルの一括変換
- **手動制御**: ファイル監視の開始/停止

### 🗂️ サポート形式

#### Cursor Rules (.mdc)
```yaml
---
type: Always | Auto Attached | Manual
description: "ルールの説明"
globs: ["**/*.ts","**/*.tsx"]
---

ルールの内容...
```

#### VSCode Instructions (.instructions.md)
```yaml
---
applyTo: "**/*.ts,**/*.tsx"
description: "インストラクションの説明"
---

インストラクションの内容...
```

## 🚀 使用方法

### コマンドパレット
1. `Ctrl+Shift+P` (Windows/Linux) または `Cmd+Shift+P` (Mac)
2. 以下のコマンドを選択：
   - `Rules Converter: Cursor Rules → VSCode Instructions`
   - `Rules Converter: VSCode Instructions → Cursor Rules`
   - `Rules Converter: 双方向同期`
   - `Rules Converter: ファイル監視を開始`
   - `Rules Converter: ファイル監視を停止`

### コンテキストメニュー
- `.mdc`ファイル右クリック → "Cursor Rules → VSCode Instructions"
- `.instructions.md`ファイル右クリック → "VSCode Instructions → Cursor Rules"

### 自動変換
ファイル監視が有効の場合、ファイルの変更を検知して自動的に変換いたします：
- `.cursor/rules/**/*.mdc` → `.github/instructions/**/*.instructions.md`
- `.github/instructions/**/*.instructions.md` → `.cursor/rules/**/*.mdc`

## ⚙️ 設定

### ファイル監視の自動開始
`settings.json`で以下の設定を追加できます：

```json
{
  "rulesConverter.autoWatch": true
}
```

- `true`: 拡張機能起動時に自動でファイル監視を開始
- `false`: 手動でファイル監視を開始（デフォルト）

## 📁 ディレクトリ構造

```
your-project/
├── .cursor/
│   └── rules/
│       ├── typescript-butler.mdc
│       └── react-guide.mdc
└── .github/
    └── instructions/
        ├── typescript-butler.instructions.md
        ├── react-guide.instructions.md
        └── python-quality.instructions.md
```

## 🔄 変換マッピング

| Cursor Rules | VSCode Instructions |
|--------------|-------------------|
| `type: Always` | `applyTo: "**"` |
| `type: Auto Attached` + `globs` | `applyTo: "glob1,glob2"` |
| `type: Manual` | `applyTo: "**"` |

## 📝 サンプルファイル

### Cursor Rule例
```yaml
---
type: Auto Attached
description: React開発ガイド
globs:
  - "**/*.tsx"
  - "**/*.jsx"
---

あなたはReact開発の執事です...
```

### 変換後のVSCode Instruction
```yaml
---
applyTo: "**/*.tsx,**/*.jsx"
description: React開発ガイド
---

あなたはReact開発の執事です...
```

## 🛠️ 開発・ビルド

```bash
# 依存関係のインストール
npm install

# TypeScriptコンパイル
npm run compile

# 監視モードでコンパイル
npm run watch
```

## 📋 必要要件

- Visual Studio Code v1.74.0以上
- Node.js (開発時)

## 🎭 執事の心得

この拡張機能は、お嬢様の開発効率を向上させるために、執事のような丁寧さで作られております：

- 🎩 エラーメッセージも丁寧な敬語
- 🔔 成功通知も品格のある表現
- 📁 ディレクトリの自動作成
- 🔄 堅牢なエラーハンドリング

## 📜 ライセンス

MIT License

---

お嬢様の快適な開発ライフをサポートさせていただきます ✨
