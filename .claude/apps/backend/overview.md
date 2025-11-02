---
title: "バックエンド アーキテクチャ概要"
status: "active"
owner: "backend-team"
last_update: "2025-02-11"
confidentiality: "internal"
---

# バックエンド アーキテクチャ概要

## 1. 概要

Meeting Facilitation AI PoCのバックエンドは、FastAPIをベースとしたRESTful APIサーバーです。
会議のファシリテーションを支援するため、音声文字起こし、要約生成、脱線検知などのAI機能を提供します。

### 1.1 技術スタック

| 項目 | 技術 | バージョン | 用途 |
|------|------|-----------|------|
| フレームワーク | FastAPI | latest | Web APIフレームワーク |
| 言語 | Python | 3.11+ | アプリケーション言語 |
| ASGIサーバー | Uvicorn | latest | 本番実行環境 |
| データバリデーション | Pydantic | 2.x | リクエスト/レスポンススキーマ |
| データストア | JSONファイル | - | 軽量データ永続化 |
| AI/ML | Azure OpenAI API | - | 要約生成・脱線検知 |
| ASR | Azure OpenAI Whisper | - | 音声文字起こし（推奨） |
| ASR（代替） | Whisper.cpp | - | ローカル音声文字起こし |
| HTTP Client | httpx | latest | Slack連携 |
| CLI | typer | latest | CLIコマンド実装 |

### 1.2 デプロイ環境

| 環境 | プラットフォーム | 備考 |
|------|----------------|------|
| 開発環境 | ローカル（Uvicorn） | `python run.py server` |
| 本番環境 | AWS ECS Fargate | CloudFormation管理（infra/24_be_ecs.yml） |
| レガシー | AWS EC2 | SSM経由デプロイ（非推奨） |

---

## 2. アーキテクチャ構成

### 2.1 ディレクトリ構造

```
backend/
├── app/
│   ├── main.py                    # FastAPIアプリケーション（エントリーポイント）
│   ├── settings.py                # 設定管理（環境変数読み込み）
│   ├── storage.py                 # JSONファイルベースのデータストア
│   │
│   ├── core/                      # コア機能・共通ユーティリティ
│   │   └── exceptions.py          # カスタム例外定義
│   │
│   ├── routers/                   # APIルーター（機能別エンドポイント）
│   │   ├── __init__.py
│   │   ├── meetings.py            # 会議CRUD・開始・終了
│   │   ├── transcripts.py         # 音声文字起こし
│   │   ├── summaries.py           # 要約・未決事項・提案生成
│   │   ├── decisions.py           # 決定事項・アクション項目
│   │   ├── parking.py             # Parking Lot（後回し項目）
│   │   └── slack.py               # Slack通知・連携
│   │
│   ├── services/                  # ビジネスロジック・外部API連携
│   │   ├── asr_service.py         # 音声認識サービス（統合）
│   │   ├── whisper_service.py     # Azure OpenAI Whisper連携
│   │   ├── free_asr.py            # Whisper.cpp連携（ローカル）
│   │   ├── llm.py                 # Azure OpenAI LLMサービス
│   │   ├── deviation.py           # 脱線検知ロジック
│   │   ├── ai_deviation.py        # AI脱線検知（LLMベース）
│   │   ├── slack.py               # Slack API連携
│   │   └── meeting_scheduler.py   # 定期要約生成スケジューラー
│   │
│   ├── schemas/                   # Pydanticスキーマ（データ構造定義）
│   │   ├── __init__.py
│   │   ├── meeting.py             # Meeting, MeetingCreate, AgendaItem
│   │   ├── transcript.py          # TranscriptChunk
│   │   ├── summary.py             # MiniSummary, Decision, ActionItem
│   │   ├── parking.py             # ParkingItem
│   │   └── slack.py               # SlackPayload
│   │
│   └── meeting_summarizer/        # 会議要約モジュール（CLI機能）
│       ├── __init__.py
│       ├── schema.py              # 要約スキーマ定義
│       ├── preprocess.py          # ASR前処理
│       ├── service.py             # 要約生成メインロジック
│       ├── presenter.py           # 出力整形（JSON/Markdown）
│       └── cli.py                 # CLIコマンド
│
├── data/                          # データ保存先（JSONファイル）
│   ├── meetings/                  # 会議データ（UUID形式）
│   │   ├── {meeting_id}/
│   │   │   ├── meeting.json       # 会議基本情報
│   │   │   ├── transcripts.json   # 文字起こしデータ
│   │   │   └── summary.json       # 要約・決定事項・アクション
│   └── summaries/                 # CLI要約出力先
│
├── whisper-cpp/                   # Whisper.cppバイナリ（ローカルASR用）
│   ├── main.exe / whisper         # Whisper実行ファイル
│   └── models/
│       └── ggml-base.bin          # Whisperモデル
│
├── run.py                         # エントリーポイント（typerベースCLI）
├── requirements.txt               # Python依存パッケージ
├── pyproject.toml                 # プロジェクト設定（ruff, black等）
├── env.example                    # 環境変数サンプル
├── log-config.yaml                # ログ設定
└── README.md                      # セットアップガイド
```

### 2.2 レイヤ構造

```
┌─────────────────────────────────────────┐
│  FastAPI Application (main.py)          │
│  - CORSミドルウェア                        │
│  - 例外ハンドラー                          │
│  - ルーター登録                            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Routers（APIエンドポイント）               │
│  - meetings.py                          │
│  - transcripts.py                       │
│  - summaries.py                         │
│  - decisions.py                         │
│  - parking.py                           │
│  - slack.py                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Services（ビジネスロジック）               │
│  - asr_service.py                       │
│  - llm.py                               │
│  - deviation.py                         │
│  - slack.py                             │
│  - meeting_scheduler.py                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  External APIs / Storage                │
│  - Azure OpenAI API                     │
│  - Azure OpenAI Whisper API             │
│  - Slack API                            │
│  - JSONファイルストレージ（storage.py）     │
└─────────────────────────────────────────┘
```

---

## 3. 主要機能

### 3.1 会議管理（meetings.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings` | GET | 会議一覧取得 |
| `/meetings` | POST | 会議作成 |
| `/meetings/{id}` | GET | 会議詳細取得 |
| `/meetings/{id}` | PUT | 会議更新 |
| `/meetings/{id}` | DELETE | 会議削除 |
| `/meetings/{id}/start` | POST | 会議開始（スケジューラー起動） |
| `/meetings/{id}/end` | POST | 会議終了（最終要約生成） |

**特徴**:
- 会議開始時に3分ごとのミニ要約生成スケジューラーを起動
- 会議終了時に最終要約をバックグラウンドで生成

### 3.2 音声文字起こし（transcripts.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings/{id}/transcribe` | POST | 音声ファイルアップロード＆文字起こし |
| `/meetings/{id}/transcripts` | GET | 文字起こし一覧取得 |
| `/meetings/{id}/transcripts` | POST | 文字起こしチャンク追加 |

**ASRプロバイダー**:
- `azure_whisper`: Azure OpenAI Whisper API（推奨・高精度）
- `whisper_python`: Python版Whisper（安定性高）
- `whisper_cpp`: Whisper.cpp（ローカル・無料）
- `stub`: ダミーテキスト（開発用）

### 3.3 要約・分析（summaries.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings/{id}/summary` | GET | 要約取得 |
| `/meetings/{id}/summary/generate` | POST | 要約生成 |
| `/meetings/{id}/deviation/check` | POST | 脱線検知実行 |

**要約生成機能**:
- 3分ごとのミニ要約（スケジューラー経由）
- 会議終了時の最終要約（バックグラウンドタスク）
- Azure OpenAI Responses API使用（長文対応）

**脱線検知**:
- アジェンダとの類似度計算（LLMベース）
- 閾値未満の場合に脱線アラート生成

### 3.4 決定事項・アクション（decisions.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings/{id}/decisions` | GET | 決定事項一覧取得 |
| `/meetings/{id}/decisions` | POST | 決定事項追加 |
| `/meetings/{id}/actions` | GET | アクション一覧取得 |
| `/meetings/{id}/actions` | POST | アクション追加 |

### 3.5 Parking Lot（parking.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings/{id}/parking` | GET | Parking Lot一覧取得 |
| `/meetings/{id}/parking` | POST | Parking Lot追加 |

**用途**: 脱線トピックを一時退避し、後で再確認する機能

### 3.6 Slack連携（slack.py）

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/slack/send` | POST | 会議サマリをSlackに送信 |

---

## 4. データモデル

### 4.1 Meeting（会議）

```python
class Meeting(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    title: str
    purpose: str
    deliverable_template: str
    meetingDate: str | None  # YYYY-MM-DD形式
    participants: list[str]
    agenda: list[AgendaItem]
    status: str  # draft, in_progress, completed
```

### 4.2 AgendaItem（アジェンダ項目）

```python
class AgendaItem(BaseModel):
    title: str
    duration: int  # 分（1-480）
    expectedOutcome: str | None
    relatedUrl: str | None
```

### 4.3 Transcript（文字起こし）

```python
class TranscriptChunk(BaseModel):
    text: str
    timestamp: str
    speaker: str | None
    confidence: float | None
```

### 4.4 Summary（要約）

```json
{
  "generated_at": "2025-02-11T10:00:00Z",
  "summary": "会議全体の要約",
  "decisions": ["決定事項1", "決定事項2"],
  "undecided": ["未決事項1", "未決事項2"],
  "actions": [
    {
      "title": "タスク名",
      "owner": "担当者",
      "due": "期限"
    }
  ]
}
```

### 4.5 ParkingItem（後回し項目）

```python
class ParkingItem(BaseModel):
    title: str
    content: str
    addToNextAgenda: bool
    created_at: str
```

---

## 5. 外部API連携

### 5.1 Azure OpenAI API（要約・脱線検知）

**設定項目**:
```env
AZURE_OPENAI_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=<api-key>
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
```

**使用箇所**:
- `services/llm.py`: 要約生成、未決事項抽出
- `services/ai_deviation.py`: 脱線検知

### 5.2 Azure OpenAI Whisper API（音声認識）

**設定項目**:
```env
ASR_PROVIDER=azure_whisper
AZURE_WHISPER_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_WHISPER_API_KEY=<api-key>
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01
ASR_LANGUAGE=ja
```

**使用箇所**:
- `services/whisper_service.py`: 音声ファイル→テキスト変換

### 5.3 Slack API

**設定項目**:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

**使用箇所**:
- `services/slack.py`: 会議サマリ送信

---

## 6. データ永続化

### 6.1 JSONファイルベースストレージ

**実装**: `app/storage.py` (DataStoreクラス)

**ディレクトリ構造**:
```
data/
└── meetings/
    └── {meeting_id}/
        ├── meeting.json       # 会議基本情報
        ├── transcripts.json   # 文字起こしデータ
        └── summary.json       # 要約・決定事項・アクション
```

**操作メソッド**:
- `save_meeting(meeting_id, data)`: 会議データ保存
- `load_meeting(meeting_id)`: 会議データ読み込み
- `list_meetings()`: 会議一覧取得
- `delete_meeting(meeting_id)`: 会議データ削除
- `save_transcripts(meeting_id, transcripts)`: 文字起こし保存
- `load_transcripts(meeting_id)`: 文字起こし読み込み
- `save_summary(meeting_id, summary)`: 要約保存
- `load_summary(meeting_id)`: 要約読み込み

**特徴**:
- 軽量・シンプル（PoC段階）
- 将来的にはPostgreSQL等への移行を想定

---

## 7. CORS設定

### 7.1 許可オリジン

**開発環境**:
```
http://localhost:3000
```

**本番環境**:
```
https://bemac-meeting.fr-aicompass.com
```

**設定箇所**: `app/settings.py`
```python
cors_origins: str = "http://localhost:3000,https://bemac-meeting.fr-aicompass.com"
```

### 7.2 CORSミドルウェア設定

**`app/main.py`**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 8. 例外ハンドリング

### 8.1 カスタム例外

**`app/core/exceptions.py`**:
```python
class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
```

### 8.2 グローバル例外ハンドラー

**`app/main.py`**:
```python
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url),
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unexpected error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
        },
    )
```

---

## 9. 起動方法

### 9.1 開発環境

```bash
# サーバー起動（自動リロード有効）
python run.py server

# オプション指定
python run.py server --host 0.0.0.0 --port 8000 --no-reload

# ヘルプ表示
python run.py --help
```

### 9.2 本番環境（ECS Fargate）

**タスク定義コマンド**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**環境変数注入**:
- CloudFormation（`infra/24_be_ecs.yml`）でSecrets Managerから注入
- 必須: `AZURE_OPENAI_API_KEY`, `CORS_ORIGINS`
- 任意: `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

---

## 10. CLI機能

### 10.1 会議要約CLI

```bash
# ファイルから要約生成（JSON形式）
python run.py summarize-meeting --file ./sample_transcript.txt

# Markdown形式で出力
python run.py summarize-meeting \
  --file ./sample_transcript.txt \
  --output ./data/summaries/summary.md \
  --format markdown

# 詳細ログを表示
python run.py summarize-meeting \
  --file ./sample_transcript.txt \
  --verbose
```

**機能**:
- 音声文字起こしテキストから要約・決定事項・未決事項・アクションを自動抽出
- JSON/Markdown形式で出力
- 長文対応（チャンク分割・統合）

---

## 11. セキュリティ

### 11.1 現在の実装

- **CORS制限**: 許可オリジンのみ
- **環境変数管理**: `.env`ファイル（`.gitignore`登録）
- **APIキー**: Secrets Manager経由注入（本番環境）

### 11.2 将来的な改善

- 認証・認可（JWT/Cognito）
- リクエストレート制限
- 入力バリデーション強化
- セキュリティヘッダー追加

---

## 12. ログ・監視

### 12.1 ログ設定

**`log-config.yaml`**: 構造化ログ設定

**出力先**:
- 開発環境: 標準出力
- 本番環境: CloudWatch Logs

### 12.2 ヘルスチェック

**エンドポイント**: `GET /health`

**レスポンス**:
```json
{
  "ok": true
}
```

---

## 13. 開発規約

### 13.1 コーディングスタイル

- **Linter**: ruff
- **Formatter**: black
- **型チェック**: mypy
- **行数制限**: 100文字

### 13.2 ファイル命名規約

- **ルーター**: `{feature}.py` (例: `meetings.py`)
- **サービス**: `{feature}_service.py` (例: `asr_service.py`)
- **スキーマ**: `{feature}.py` (例: `meeting.py`)

### 13.3 依存関係

- **型注釈**: 必須（`from __future__ import annotations`使用）
- **例外処理**: カスタム例外クラス使用
- **ログ**: 標準loggingモジュール使用

---

## 14. 今後の改善課題

### 14.1 データベース移行

- JSONファイル → PostgreSQL
- RLS（Row Level Security）による分離
- インデックス最適化

### 14.2 認証・認可

- Cognito統合
- JWTトークン検証
- ロールベースアクセス制御

### 14.3 パフォーマンス

- Redis導入（キャッシュ）
- データベース接続プーリング
- 非同期処理の最適化

### 14.4 監視・運用

- メトリクス収集（Prometheus）
- トレーシング（AWS X-Ray）
- アラート設定（CloudWatch Alarms）

---

## 関連ドキュメント

- [バックエンドREADME](../../backend/README.md)
- [ASRセットアップガイド](../../backend/ASR_SETUP.md)
- [会議要約機能ガイド](../../backend/MEETING_SUMMARY_GUIDE.md)
- [デプロイガイド（ECS）](../../backend/README.md#本番環境デプロイecs)
- [API仕様書](../../backend/README.md#api仕様)
