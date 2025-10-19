# Meeting Facilitation AI PoC - Backend

FastAPIベースのバックエンドアプリケーション。会議の文字起こし、脱線検知、要約生成を提供します。

## 📦 機能

### 1. 会議管理API
- 会議の作成・取得・更新
- 文字起こし（ASR）の保存・管理
- 決定事項・アクションアイテムの記録

### 2. 脱線検知
- リアルタイム脱線検知
- アジェンダとの一致度判定

### 3. 🆕 会議要約生成（CLI）
音声文字起こし（ASR）テキストから、以下の4要素を自動抽出：
- **要約（summary）**: 会議全体の要約
- **決定事項（decisions）**: 決定された内容のリスト
- **未決事項（undecided）**: 保留・未決定の項目
- **アクション（actions）**: タスク（担当者・期限付き）

詳細は **[会議要約機能ガイド](./MEETING_SUMMARY_GUIDE.md)** を参照してください。

## 🚀 セットアップ

### 前提条件
- Python 3.11以上
- Azure OpenAI API（会議要約機能を使用する場合）

### 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 環境変数の設定

`.env` ファイルを作成（`env.example` をコピー）：

```bash
cp env.example .env
```

必要な環境変数を設定：

```env
# Azure OpenAI設定（会議要約機能用）
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini

# その他の設定
DATA_DIR=./data
CORS_ORIGINS=http://localhost:3000
```

## 💻 使用方法

> **📌 重要**: `run.py`は`typer`ベースのCLIツールです。サブコマンド形式で実行してください。

### FastAPIサーバーの起動

```bash
# 基本起動（開発モード：自動リロード有効）
python run.py server

# オプション指定
python run.py server --host 0.0.0.0 --port 8000 --no-reload

# ヘルプ表示
python run.py --help
python run.py server --help
```

APIドキュメント: http://localhost:8000/docs

**利用可能なサブコマンド**:
- `server` - FastAPIサーバーを起動
- `summarize-meeting` - 会議要約を生成（詳細は下記参照）

### 音声認識（ASR）のセットアップ

音声文字起こし機能を使用する場合、以下のいずれかの方法でASRを設定してください：

#### オプション1: OpenAI Whisper API（簡単）
```bash
# .env ファイルに設定
ASR_PROVIDER=openai_whisper
OPENAI_API_KEY=your_actual_api_key_here
```

#### オプション2: Whisper.cpp（無料・ローカル）
```bash
# 自動セットアップ
python setup_free_asr.py

# または手動セットアップ
ASR_PROVIDER=whisper_cpp
WHISPER_EXECUTABLE_PATH=./whisper-cpp/whisper.exe
WHISPER_MODEL_PATH=./whisper-cpp/models/ggml-base.bin
```

詳細は **[ASRセットアップガイド](./ASR_SETUP.md)** または **[無料ASR実装ガイド](./FREE_ASR_GUIDE.md)** を参照してください。

### 会議要約CLI

```bash
# ファイルからJSON形式で要約生成（標準出力）
python run.py summarize-meeting --file ./sample_transcript.txt

# ファイルに保存（推奨）
python run.py summarize-meeting \
  --file ./sample_transcript.txt \
  --output ./data/summaries/summary.json

# Markdown形式で出力
python run.py summarize-meeting \
  --file ./sample_transcript.txt \
  --output ./data/summaries/summary.md \
  --format markdown

# 標準入力から読み込み
cat transcript.txt | python run.py summarize-meeting

# 詳細ログを表示
python run.py summarize-meeting \
  --file ./sample_transcript.txt \
  --output ./data/summaries/summary.json \
  --verbose

# ヘルプ表示
python run.py summarize-meeting --help
```

**オプション**:
- `--file` / `-f` : 入力ASRテキストファイルのパス（未指定時はSTDIN）
- `--output` / `-o` : 出力先ファイルパス（未指定時は標準出力）
- `--format` : 出力形式（`json` または `markdown`、デフォルト: `json`）
- `--keep-noise` : フィラー削除を弱める（原文優先）
- `--verbose` / `-v` : 詳細ログを表示

詳細は **[会議要約機能ガイド](./MEETING_SUMMARY_GUIDE.md)** を参照してください。

## 📁 プロジェクト構成

```
backend/
├── app/
│   ├── main.py                    # FastAPIアプリケーション
│   ├── settings.py                # 設定管理
│   ├── storage.py                 # データストア
│   ├── core/
│   │   └── exceptions.py          # カスタム例外
│   ├── services/
│   │   ├── asr.py                 # 音声文字起こし
│   │   ├── deviation.py           # 脱線検知
│   │   ├── llm.py                 # LLMサービス
│   │   └── slack.py               # Slack連携
│   └── meeting_summarizer/        # 🆕 会議要約モジュール
│       ├── __init__.py
│       ├── schema.py              # 出力スキーマ定義
│       ├── preprocess.py          # ASR前処理
│       ├── service.py             # メインロジック
│       ├── presenter.py           # 出力整形
│       └── cli.py                 # CLIコマンド
├── data/                          # 会議データ保存先
│   ├── meetings/                  # 会議データ（UUID形式）
│   ├── summaries/                 # 要約データ（CLI出力）
│   └── test/                      # テストデータ
├── run.py                         # エントリーポイント
├── requirements.txt               # Python依存関係
├── env.example                    # 環境変数サンプル
├── sample_transcript.txt          # サンプルASRテキスト
├── setup_free_asr.py              # 無料ASR自動セットアップスクリプト
├── README.md                      # このファイル
├── MEETING_SUMMARY_GUIDE.md       # 会議要約機能の詳細ガイド
├── ASR_SETUP.md                   # ASRセットアップガイド
└── FREE_ASR_GUIDE.md              # 無料ASR実装ガイド
```

## 🛠️ 開発

### Linter実行

```bash
# ruffでコードチェック
ruff check app/

# 自動修正
ruff check --fix app/
```

### テスト実行

```bash
pytest
```

## 📚 API仕様

### 主要エンドポイント

#### 会議管理
- `GET /meetings` - 会議一覧取得
- `POST /meetings` - 会議作成
- `GET /meetings/{meeting_id}` - 会議詳細取得
- `PUT /meetings/{meeting_id}` - 会議更新

#### 文字起こし
- `POST /meetings/{meeting_id}/transcribe` - 音声アップロード＆文字起こし
- `GET /meetings/{meeting_id}/transcripts` - 文字起こし一覧取得

#### 脱線検知
- `POST /meetings/{meeting_id}/deviation/check` - 脱線検知実行

詳細は http://localhost:8000/docs を参照してください。

## 🔧 トラブルシューティング

### 依存関係のインストールエラー

```bash
# Python仮想環境を作成して再試行
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Azure OpenAI APIエラー

環境変数が正しく設定されているか確認：

```bash
# Windowsの場合
echo $env:AZURE_OPENAI_ENDPOINT
echo $env:AZURE_OPENAI_API_KEY

# Linux/Macの場合
echo $AZURE_OPENAI_ENDPOINT
echo $AZURE_OPENAI_API_KEY
```

### ASR（音声認識）のエラー

**エラー**: `FileNotFoundError: Whisper.cpp not found`
```bash
# 解決方法: パスを正しく設定
export WHISPER_EXECUTABLE_PATH=/path/to/whisper.exe
```

**エラー**: `401 Unauthorized (OpenAI Whisper API)`
```bash
# 解決方法: APIキーを確認
echo $env:OPENAI_API_KEY  # Windows
echo $OPENAI_API_KEY      # Linux/Mac
```

詳細は **[ASRセットアップガイド](./ASR_SETUP.md)** を参照してください。

## 📖 関連ドキュメント

- [会議要約機能ガイド](./MEETING_SUMMARY_GUIDE.md) - 会議要約CLIの詳細
- [ASRセットアップガイド](./ASR_SETUP.md) - 音声認識のセットアップ方法
- [無料ASR実装ガイド](./FREE_ASR_GUIDE.md) - 完全無料で音声認識を実装する方法
- [セットアップガイド](../SETUP_GUIDE.md) - プロジェクト全体のセットアップ
- [フロントエンド規約](../docs/frontend-rules.md)
- [バックエンド規約](../docs/backend-rules.md)

## 📝 更新履歴

### 2025-01-16
- 🆕 会議要約機能を追加（Azure AI Foundry Responses API使用）
- ⚙️ `run.py`を`typer`ベースのCLIツールに変更（サブコマンド形式）
- CLIコマンド `summarize-meeting` を実装
- 長文ASRテキストのチャンク分割・統合機能
- JSON/Markdown両形式の出力対応
- `--output`オプションで要約の保存先を指定可能

### 以前のバージョン
- FastAPI基盤実装
- 会議管理API
- 脱線検知機能
- Slack連携

## 🚀 本番環境デプロイ

### AWS EC2へのデプロイ

本番環境（AWS EC2）へのデプロイ方法：

**詳細ドキュメント**:
- **[DEPLOY_AUTOMATION_SSM.md](./DEPLOY_AUTOMATION_SSM.md)** - SSM経由の自動デプロイ（推奨）
- **[DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)** - EC2環境のセットアップ
- **[GITHUB_SECRETS_SSM.md](./GITHUB_SECRETS_SSM.md)** - GitHub Secretsの設定

### クイックスタート

1. **EC2セットアップ** → [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) を参照
2. **IAMロール設定** → [DEPLOY_AUTOMATION_SSM.md](./DEPLOY_AUTOMATION_SSM.md) を参照
3. **GitHub Secrets設定** → [GITHUB_SECRETS_SSM.md](./GITHUB_SECRETS_SSM.md) を参照
4. **デプロイ実行**:
   ```bash
   git push origin main  # 自動デプロイ
   ```

### デプロイ方法

- **自動デプロイ**: mainブランチへのpushで自動実行（GitHub Actions + AWS SSM）
- **手動デプロイ**: GitHub Actionsから「Run workflow」で実行

---

## 📄 ライセンス

このプロジェクトはPoC（概念実証）です。
