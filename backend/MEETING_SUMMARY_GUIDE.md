# 会議要約機能 使用ガイド

## 概要

音声文字起こし（ASR）テキストから会議要約を自動生成する機能です。

**出力内容:**
- `summary`: 会議全体の要約
- `decisions`: 決定事項の配列
- `undecided`: 未決事項の配列
- `actions`: アクションアイテムの配列（担当者・期限付き）

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Azure OpenAI設定（必須）
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini

# オプション設定（デフォルト値あり）
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
DEFAULT_TIMEZONE=Asia/Tokyo
```

**注意:** `env.example` をコピーして `.env` を作成できます。

```bash
cp env.example .env
# .env を編集してAPIキーを設定
```

## 使用方法

### 基本的な使い方

#### 1. ファイルから読み込み（JSON出力）

```bash
python run.py summarize-meeting --file ./sample_transcript.txt
```

#### 2. ファイルから読み込み（Markdown出力）

```bash
python run.py summarize-meeting --file ./sample_transcript.txt --format markdown
```

#### 3. 標準入力から読み込み

```bash
cat transcript.txt | python run.py summarize-meeting --format markdown
```

#### 4. 詳細ログを表示

```bash
python run.py summarize-meeting --file ./sample_transcript.txt --verbose
```

#### 5. フィラー削除を弱める（原文優先）

```bash
python run.py summarize-meeting --file ./sample_transcript.txt --keep-noise
```

### 出力形式

#### JSON形式（既定）

```json
{
  "summary": "プロジェクトXの進捗報告会議。現在の進捗状況を確認し...",
  "decisions": [
    "次回のリリース日を2024年3月15日に決定",
    "新機能Aの優先度を高に変更"
  ],
  "undecided": [
    "予算増額の可否（経営会議で再検討）"
  ],
  "actions": [
    {
      "title": "新機能Aの設計書作成",
      "owner": "山田",
      "due": "2024-03-10"
    },
    {
      "title": "テスト環境のセットアップ",
      "owner": "佐藤",
      "due": null
    }
  ]
}
```

#### Markdown形式

```markdown
# 要約

プロジェクトXの進捗報告会議。現在の進捗状況を確認し...

# 決定事項

1. 次回のリリース日を2024年3月15日に決定
2. 新機能Aの優先度を高に変更

# 未決事項

1. 予算増額の可否（経営会議で再検討）

# アクション

1. **新機能Aの設計書作成** (担当: 山田, 期限: 2024-03-10)
2. **テスト環境のセットアップ** (担当: 佐藤)
```

## コマンドオプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--file`, `-f` | ASRテキストファイルのパス（未指定時はSTDIN） | なし |
| `--format` | 出力形式（`json` または `markdown`） | `json` |
| `--keep-noise` | フィラー削除を弱める（原文優先） | `False` |
| `--verbose`, `-v` | 詳細ログを表示 | `False` |

## API仕様

### 使用API

1. **Azure AI Foundry Responses API（既定）**
   - エンドポイント: `{AZURE_OPENAI_ENDPOINT}/openai/responses`
   - APIバージョン: `2025-04-01`（設定可能）
   - 厳格なJSON Schemaによる構造化出力

2. **Chat Completions API（フォールバック）**
   - Azure OpenAI SDK使用
   - APIバージョン: `2024-12-01-preview`（設定可能）
   - Responses API失敗時に自動切替

### リトライ戦略

- 最大3回のリトライ
- 指数バックオフ（2秒、4秒、8秒）
- リトライ対象: `429`, `500`, `502`, `503`, `504`

### 長文対応

- 約8,000トークン単位でチャンク分割
- 各チャンクを個別に要約
- 結果を統合して重複除去
- アクションアイテムは`title`をキーにマージ

## ASR前処理

### 実施内容

1. **フィラー・ノイズの削減**
   - 削除対象: `えーと`, `あのー`, `(笑)`, `[noise]` 等
   - `--keep-noise` 指定時は削減を弱める

2. **話者ラベルの正規化**
   - `[山田]` → `山田:`

3. **タイムスタンプの保持**
   - `[hh:mm:ss]` 形式は根拠追跡用に保持

4. **空白の整理**
   - 連続スペースを1つに
   - 3連続以上の改行を2つに

## トラブルシューティング

### エラー: "Azure OpenAI設定が不完全です"

**原因:** 環境変数が設定されていない

**解決方法:**
```bash
# .envファイルを確認
cat .env

# 必須項目が設定されているか確認
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
```

### エラー: "要約生成に失敗しました"

**原因:** API呼び出しの失敗またはレスポンス形式の問題

**解決方法:**
1. `--verbose` オプションで詳細ログを確認
2. APIキーとエンドポイントが正しいか確認
3. デプロイ名が正しいか確認

```bash
python run.py summarize-meeting --file ./sample_transcript.txt --verbose
```

### エラー: "ModuleNotFoundError: No module named 'openai'"

**原因:** 依存パッケージがインストールされていない

**解決方法:**
```bash
cd backend
pip install -r requirements.txt
```

## サンプルASRテキスト

`sample_transcript.txt` を参照してください。

## 今後の拡張予定

- [ ] FastAPI エンドポイントの追加
- [ ] 会議データとの統合
- [ ] 自動要約トリガー（会議終了時）
- [ ] 要約結果の保存・履歴管理

## 関連ファイル

- `app/meeting_summarizer/` - メインモジュール
- `app/settings.py` - 設定管理
- `run.py` - CLIエントリーポイント
- `env.example` - 環境変数サンプル


