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

必要な環境変数（`app/settings.py` に準拠）：

```env
# アプリ基本設定
APP_NAME=Facilitation AI PoC
DEBUG=false
DEFAULT_TIMEZONE=Asia/Tokyo

# データ保存先
DATA_DIR=./data
SUMMARIES_DIR=./data/summaries

# CORS設定（カンマ区切り）
CORS_ORIGINS=http://localhost:3000,https://<your-frontend-domain>

# ASR（音声認識）設定
# 選択肢: stub | whisper_python | azure_whisper（推奨）
ASR_PROVIDER=azure_whisper
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0

# Azure OpenAI Whisper（ASR用）
AZURE_WHISPER_ENDPOINT=
AZURE_WHISPER_API_KEY=
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01

# Azure OpenAI（要約・脱線検知用）
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
```

補足:
- 環境変数名は大文字スネークケースで指定できます（`BaseSettings(case_sensitive=False)`）。
- ECSデプロイでは一部の変数はタスク定義から上書き注入されます（後述）。

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
│   ├── main.py                    # FastAPIアプリケーションエントリーポイント
│   ├── settings.py                # 設定管理（pydantic-settings）
│   ├── storage.py                 # JSONファイルを扱う軽量データストア
│   │
│   ├── schemas/                   # Pydanticモデル（データ構造定義）
│   │   ├── __init__.py
│   │   ├── meeting.py             # Meeting, MeetingCreate, AgendaItem
│   │   ├── transcript.py           # TranscriptChunk（文字起こし結果）
│   │   ├── summary.py             # MiniSummary, Decision, ActionItem
│   │   ├── parking.py             # ParkingItem
│   │   └── slack.py               # SlackPayload
│   │
│   ├── routers/                    # APIルーター（機能別エンドポイント）
│   │   ├── __init__.py
│   │   ├── meetings.py            # 会議CRUD（作成・取得・更新）
│   │   ├── transcripts.py         # 音声文字起こし（Whisper連携）
│   │   ├── summaries.py            # 要約・分析・脱線検知
│   │   ├── decisions.py            # 決定事項・アクション項目
│   │   ├── parking.py             # Parking Lot（後回し項目管理）
│   │   └── slack.py                # Slack通知・連携処理
│   │
│   ├── services/                   # 各種業務ロジック
│   │   ├── __init__.py
│   │   ├── asr.py                  # 音声認識サービス（Azure Whisper / Python Whisper）
│   │   ├── azure_whisper_service.py # Azure OpenAI Whisper API連携
│   │   ├── deviation.py            # 脱線検知サービス（従来手法：Jaccard係数）
│   │   ├── ai_deviation.py         # AI脱線検知サービス（LLM使用）
│   │   ├── llm.py                  # LLM（GPT）要約・未決事項抽出・提案生成
│   │   ├── meeting_scheduler.py    # 会議中の自動要約生成スケジューラー
│   │   └── slack.py                # Slack API連携
│   │
│   ├── meeting_summarizer/         # 🆕 会議要約生成モジュール
│   │   ├── __init__.py
│   │   ├── service.py              # メインロジック（Azure AI Foundry Responses API使用）
│   │   ├── preprocess.py           # ASR前処理（フィラー削除、チャンク分割）
│   │   ├── presenter.py            # 出力整形（JSON/Markdown）
│   │   ├── schema.py               # 出力スキーマ定義（Pydanticモデル）
│   │   └── cli.py                   # CLIコマンド（typer使用）
│   │
│   ├── core/                       # 共通ユーティリティ
│   │   ├── __init__.py
│   │   └── exceptions.py           # カスタム例外定義
│   │
│   └── data/                       # データディレクトリ（実行時に生成）
│       └── meetings/               # 会議データ（会議ID毎にディレクトリ）
│           └── {meeting_id}/
│               ├── meeting.json   # 会議メタデータ
│               ├── transcripts.json # 文字起こしデータ
│               ├── summary.json    # 要約データ（API生成）
│               └── audio.wav      # 録音ファイル（オプション）
│
├── run.py                          # エントリーポイント（typerベースCLI）
├── requirements.txt                # Python依存関係
├── pyproject.toml                  # Linter設定（ruff, mypy）
├── env.example                     # 環境変数サンプル
├── sample_transcript.txt           # サンプルASRテキスト（会議要約CLI用）
├── setup_free_asr.py               # 無料ASR自動セットアップスクリプト
├── README.md                       # このファイル
├── MEETING_SUMMARY_GUIDE.md        # 会議要約機能の詳細ガイド
├── ASR_SETUP.md                    # ASRセットアップガイド
└── FREE_ASR_GUIDE.md               # 無料ASR実装ガイド
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

## 🚀 本番環境デプロイ（ECS）

本番は ECS(Fargate) で稼働します。バックエンド用スタックは `infra/24_be_ecs.yml` です。

### CodeBuild/CodePipeline（推奨）

- ビルド仕様: `buildspec.be.yml`
- Dockerfile: `.github/docker/api/Dockerfile`
- 出力物:
  - `image.json`（イメージタグを格納）
  - `imagedefinitions.json`（ECSサービス更新用定義。CodePipeline がこれを参照）

パイプラインの流れ（概略）:

1. CodeBuild が Docker build（`.github/docker/api/Dockerfile`）
2. ECR にタグ付きで push（`IMAGE_TAG`）
3. `imagedefinitions.json` をアーティファクトに出力
4. CodePipeline が ECS サービスへ新イメージを適用

運用上の注意:

- アカウントIDやリージョンは CodeBuild 内で動的に解決（`aws sts get-caller-identity`）。
- 環境変数（`CORS_ORIGINS` 等）は CloudFormation（`infra/24_be_ecs.yml`）のタスク定義から注入可。

#### 本番構成（実値）

- バックエンドALB（DNS）: `https://bemac-meeting-fe-alb-1103801797.ap-northeast-1.elb.amazonaws.com`
- フロント公開ドメイン: `https://bemac-meeting.fr-aicompass.com`
- AWSアカウントID: `111938288341`
- ECSクラスタ名: `bemac-fe-cluster`
- サービス名（BE）: `bemac-be-svc`
- サービス名（FE）: `bemac-fe-svc`
- タスク定義名（BE）: `bemac-be-task`
- タスク定義名（FE）: `bemac-fe-task`
- CodeBuildプロジェクト（BE）: `bemac-be-build`
- CodeBuildプロジェクト（FE）: `bemac-fe-build`
- CodePipeline（BE）: `bemac-be-pipeline`
- CodePipeline（FE）: `bemac-fe-pipeline`

推奨設定:

- CORS_ORIGINS に `https://bemac-meeting.fr-aicompass.com` を含める
- フロントの `BACKEND_API_URL` は上記ALB DNSを指定（HTTPS推奨）

> 注記: フロントエンド/バックエンドはいずれも同一ECSクラスタ `bemac-fe-cluster` 上で稼働します。

### 事前準備

- VPC/サブネット/ALB/TargetGroup/ECR は別スタックで用意済み（ImportValue を参照）。
- Secrets Manager にアプリ用シークレットを作成（命名: `${CustomerName}-${ProjectName}-${Environment}-app-secrets`）。
  - 必須: `AZURE_OPENAI_API_KEY`
  - 任意: `DATABASE_URL`（DB未使用なら空で可）、`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`（必要時）

### パラメータ

- `CustomerName`/`ProjectName`/`Environment`/`SystemName`: 命名規則に使用
- `DomainName`: フロントエンド公開ドメイン（CORSに反映）
- `ContainerCpu`/`ContainerMemory`: Fargate リソース設定（既定: 1024/2048）
- `DesiredCount`: タスク数（0=停止, 本番は >=1）
- `Port`: 8000 固定（`uvicorn` で起動）

### デプロイ手順（CloudFormation）

1. コンテナイメージを ECR に `latest` としてプッシュ（別リポジトリ／パイプラインを利用）
2. `infra/24_be_ecs.yml` をスタック作成/更新
   - `DomainName` をフロントエンドの FQDN に設定
   - 必要なら `DesiredCount` を 1 以上に設定
3. デプロイ後、ALB→TargetGroup→サービス経由で疎通確認

### タスク内の環境変数

スタックは次を注入します（必要に応じて変更可）。アプリが参照する主な変数は README の「環境変数」節に準拠します。

- Secrets（機密）
  - `AZURE_OPENAI_API_KEY`（必須）
  - `DATABASE_URL`（任意）
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`（任意）
- Environment（非機密の例）
  - `CORS_ORIGINS`（`https://${DomainName}` に設定）
  - `AWS_REGION`、`DEBUG=false` など

### 起動コマンド

タスク定義にて `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4` を実行します。

---

## 📄 ライセンス

このプロジェクトはPoC（概念実証）です。