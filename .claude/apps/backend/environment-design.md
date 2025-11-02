---
title: "環境変数設計書"
status: "active"
owner: "backend-team"
last_update: "2025-02-11"
confidentiality: "internal"
related:
  - ".claude/apps/backend/overview.md"
  - ".claude/apps/backend/storage-design.md"
---

# 環境変数設計書

## 1. 概要

### 1.1 目的

Meeting Facilitation AI PoCにおける環境変数の仕様を定義します。
開発環境（dev）、ステージング環境（staging）、本番環境（prod）での設定値を一元管理します。

### 1.2 設計方針

- **環境分離**: 環境ごとに異なる設定値を持つ
- **セキュリティ**: 秘密情報（APIキー）は環境変数で管理
- **デフォルト値**: 開発環境向けの安全なデフォルト値を設定
- **型安全性**: Pydantic Settingsで型チェック
- **バリデーション**: 起動時に必須環境変数の存在確認

### 1.3 設定ファイル

| ファイル | 説明 | Git管理 |
|---------|------|---------|
| `.env` | 実際の環境変数ファイル（ローカル開発用） | ❌ (.gitignoreに追加) |
| `env.example` | 環境変数のサンプル（API keyはダミー） | ✅ |
| `backend/app/settings.py` | 環境変数定義（Pydantic Settings） | ✅ |

---

## 2. 環境変数一覧

### 2.1 アプリケーション設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `APP_NAME` | string | `"Facilitation AI PoC"` | アプリケーション名 | - | 全環境同じ |
| `DEBUG` | boolean | `false` | デバッグモード（詳細ログ出力） | - | dev: `true`<br>staging/prod: `false` |

**使用箇所**:
- `app/main.py` - FastAPIアプリケーション初期化時のタイトル設定
- ログレベルの制御

**設定例**:
```bash
# 開発環境
APP_NAME=Facilitation AI PoC
DEBUG=true

# 本番環境
APP_NAME=Facilitation AI PoC
DEBUG=false
```

---

### 2.2 データストレージ設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `DATA_DIR` | string | `"./data"` | 会議データの保存先ディレクトリ | - | dev: `./data`<br>prod: `/mnt/efs/data` |
| `SUMMARIES_DIR` | string | `"./data/summaries"` | 要約データの保存先（レガシー） | - | dev: `./data/summaries` |

**使用箇所**:
- `app/storage.py` - `DataStore`クラスの初期化
- `app/main.py` - アプリ起動時のディレクトリ作成

**設定例**:
```bash
# 開発環境（ローカルディレクトリ）
DATA_DIR=./data
SUMMARIES_DIR=./data/summaries

# 本番環境（EFS マウントポイント）
DATA_DIR=/mnt/efs/data
SUMMARIES_DIR=/mnt/efs/data/summaries
```

**注意事項**:
- ECS Fargate環境では永続化のためにEFSをマウントする必要あり
- ローカル環境では相対パス、本番環境では絶対パスを推奨

---

### 2.3 外部API設定

#### 2.3.1 OpenAI API（レガシー）

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `OPENAI_API_KEY` | string | `""` | OpenAI APIキー（現在未使用） | - | 全環境: 空文字列 |

**現状**: Azure OpenAI APIに移行したため未使用（将来の拡張用に残存）

#### 2.3.2 Slack連携

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `SLACK_WEBHOOK_URL` | string | `""` | Slack Incoming Webhook URL | - | dev: 空（未使用）<br>prod: 実際のURL |

**使用箇所**:
- `app/routers/slack.py` - 会議サマリのSlack送信

**設定例**:
```bash
# 開発環境（Slack送信無効）
SLACK_WEBHOOK_URL=

# 本番環境
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**取得方法**:
1. Slackワークスペースで「Incoming Webhooks」アプリをインストール
2. チャンネルを選択してWebhook URLを生成
3. 環境変数に設定

---

### 2.4 CORS設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `CORS_ORIGINS` | string | `"http://localhost:3000,https://bemac-meeting.fr-aicompass.com"` | 許可するオリジン（カンマ区切り） | - | dev: `http://localhost:3000`<br>prod: 実際のフロントエンドURL |

**使用箇所**:
- `app/main.py` - FastAPI CORS middleware設定

**設定例**:
```bash
# 開発環境
CORS_ORIGINS=http://localhost:3000

# 本番環境（複数ドメイン）
CORS_ORIGINS=https://example.com,https://www.example.com
```

**注意事項**:
- セキュリティのため、本番環境では必ず実際のドメインを指定
- ワイルドカード（`*`）は非推奨

---

### 2.5 ASR（音声認識）設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `ASR_PROVIDER` | enum | `"azure_whisper"` | ASRプロバイダー<br>`"stub"`: ダミーテキスト<br>`"whisper_python"`: Python版Whisper<br>`"azure_whisper"`: Azure OpenAI Whisper | - | 全環境: `azure_whisper` |
| `ASR_LANGUAGE` | string | `"ja"` | 音声認識の言語コード（ISO 639-1） | - | 全環境: `ja` |
| `ASR_TEMPERATURE` | float | `0.0` | Whisperのtemperatureパラメータ（0.0-1.0） | - | 全環境: `0.0` |

**使用箇所**:
- `app/services/asr_service.py` - ASRプロバイダーの選択
- `app/services/azure_whisper_service.py` - Azure Whisper API呼び出し

**ASR_PROVIDERの選択基準**:

| プロバイダー | 用途 | メリット | デメリット |
|------------|------|---------|----------|
| `stub` | 開発・テスト | APIキー不要、高速 | 実際の文字起こしなし |
| `whisper_python` | ローカル環境 | オフライン動作、無料 | GPU必要、セットアップ複雑 |
| `azure_whisper` | 本番環境 | 高精度、メンテナンス不要 | API課金あり |

**設定例**:
```bash
# 開発環境（Azure Whisper使用）
ASR_PROVIDER=azure_whisper
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0

# テスト環境（ダミーテキスト）
ASR_PROVIDER=stub
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
```

---

### 2.6 Azure OpenAI Whisper設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `AZURE_WHISPER_ENDPOINT` | string | `""` | Azure OpenAI Whisperエンドポイント<br>形式: `https://{resource}.cognitiveservices.azure.com/` | ✅ | 環境ごとに異なるリソース |
| `AZURE_WHISPER_API_KEY` | string | `""` | Azure OpenAI Whisper APIキー | ✅ | 環境ごとに異なるキー |
| `AZURE_WHISPER_DEPLOYMENT` | string | `"whisper"` | Whisperモデルのデプロイメント名 | - | 全環境: `whisper` |
| `AZURE_WHISPER_API_VERSION` | string | `"2024-06-01"` | Azure OpenAI APIバージョン | - | 全環境: `2024-06-01` |

**使用箇所**:
- `app/services/asr_service.py` - Azure Whisper API呼び出し

**取得方法**:
1. Azure Portalで「Azure OpenAI Service」リソースを作成
2. 「Keys and Endpoint」からエンドポイントとAPIキーを取得
3. 「Model deployments」で`whisper`モデルをデプロイ

**設定例**:
```bash
# 開発環境
AZURE_WHISPER_ENDPOINT=https://dev-openai.cognitiveservices.azure.com/
AZURE_WHISPER_API_KEY=abc123...
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01

# 本番環境
AZURE_WHISPER_ENDPOINT=https://prod-openai.cognitiveservices.azure.com/
AZURE_WHISPER_API_KEY=xyz789...
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01
```

**料金**:
- 音声1分あたり約$0.006（2024年11月時点）
- 1時間の会議で約$0.36

---

### 2.7 Azure OpenAI設定（会議要約・脱線検知用）

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `AZURE_OPENAI_ENDPOINT` | string | `""` | Azure OpenAIエンドポイント<br>形式: `https://{resource}.cognitiveservices.azure.com/` | ✅ | 環境ごとに異なるリソース |
| `AZURE_OPENAI_API_KEY` | string | `""` | Azure OpenAI APIキー | ✅ | 環境ごとに異なるキー |
| `AZURE_OPENAI_API_VERSION_RESPONSES` | string | `"2025-04-01-preview"` | Responses API用のバージョン | - | 全環境: `2025-04-01-preview` |
| `AZURE_OPENAI_API_VERSION_CHAT` | string | `"2024-12-01-preview"` | Chat Completions API用のバージョン | - | 全環境: `2024-12-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | string | `"gpt-5-mini"` | LLMモデルのデプロイメント名 | - | dev: `gpt-5-mini`<br>prod: `gpt-5` |

**使用箇所**:
- `app/services/llm.py` - 要約生成・脱線検知
- `app/meeting_summarizer/service.py` - 会議サマリ生成

**取得方法**:
1. Azure Portalで「Azure OpenAI Service」リソースを作成
2. 「Keys and Endpoint」からエンドポイントとAPIキーを取得
3. 「Model deployments」でGPTモデルをデプロイ

**モデル選択**:

| モデル | 用途 | トークン上限 | 料金 |
|--------|------|------------|------|
| `gpt-5-mini` | 開発・テスト | 128K | 安価 |
| `gpt-5` | 本番環境 | 128K | 高精度 |

**設定例**:
```bash
# 開発環境（gpt-5-mini使用）
AZURE_OPENAI_ENDPOINT=https://dev-openai.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=abc123...
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01-preview
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini

# 本番環境（gpt-5使用）
AZURE_OPENAI_ENDPOINT=https://prod-openai.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=xyz789...
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01-preview
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5
```

**APIバージョンの選択**:
- `AZURE_OPENAI_API_VERSION_RESPONSES`: Structured Outputsを使用する場合
- `AZURE_OPENAI_API_VERSION_CHAT`: 通常のChat Completions API

---

### 2.8 その他の設定

| 変数名 | 型 | デフォルト値 | 説明 | 必須 | 環境別設定 |
|--------|---|------------|------|------|-----------|
| `DEFAULT_TIMEZONE` | string | `"Asia/Tokyo"` | デフォルトタイムゾーン（pytz形式） | - | 全環境: `Asia/Tokyo` |

**使用箇所**:
- 日時表示のローカライズ
- 会議日程の処理

**設定例**:
```bash
DEFAULT_TIMEZONE=Asia/Tokyo
```

---

## 3. 環境別設定値

### 3.1 開発環境（dev/local）

```bash
# アプリケーション設定
APP_NAME=Facilitation AI PoC
DEBUG=true

# データベース
DATA_DIR=./data
SUMMARIES_DIR=./data/summaries

# 外部API
OPENAI_API_KEY=
SLACK_WEBHOOK_URL=

# CORS設定
CORS_ORIGINS=http://localhost:3000

# ASR設定
ASR_PROVIDER=azure_whisper
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0

# Azure OpenAI Whisper設定
AZURE_WHISPER_ENDPOINT=https://dev-openai.cognitiveservices.azure.com/
AZURE_WHISPER_API_KEY=your-dev-api-key-here
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01

# Azure OpenAI設定（会議要約・脱線検知用）
AZURE_OPENAI_ENDPOINT=https://dev-openai.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-dev-api-key-here
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01-preview
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
DEFAULT_TIMEZONE=Asia/Tokyo
```

### 3.2 ステージング環境（staging）

```bash
# アプリケーション設定
APP_NAME=Facilitation AI PoC
DEBUG=false

# データベース
DATA_DIR=/mnt/efs/data
SUMMARIES_DIR=/mnt/efs/data/summaries

# 外部API
OPENAI_API_KEY=
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/staging-webhook

# CORS設定
CORS_ORIGINS=https://staging.example.com

# ASR設定
ASR_PROVIDER=azure_whisper
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0

# Azure OpenAI Whisper設定
AZURE_WHISPER_ENDPOINT=https://staging-openai.cognitiveservices.azure.com/
AZURE_WHISPER_API_KEY=your-staging-api-key-here
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01

# Azure OpenAI設定（会議要約・脱線検知用）
AZURE_OPENAI_ENDPOINT=https://staging-openai.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-staging-api-key-here
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01-preview
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
DEFAULT_TIMEZONE=Asia/Tokyo
```

### 3.3 本番環境（prod）

```bash
# アプリケーション設定
APP_NAME=Facilitation AI PoC
DEBUG=false

# データベース
DATA_DIR=/mnt/efs/data
SUMMARIES_DIR=/mnt/efs/data/summaries

# 外部API
OPENAI_API_KEY=
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/prod-webhook

# CORS設定
CORS_ORIGINS=https://example.com,https://www.example.com

# ASR設定
ASR_PROVIDER=azure_whisper
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0

# Azure OpenAI Whisper設定
AZURE_WHISPER_ENDPOINT=https://prod-openai.cognitiveservices.azure.com/
AZURE_WHISPER_API_KEY=your-prod-api-key-here
AZURE_WHISPER_DEPLOYMENT=whisper
AZURE_WHISPER_API_VERSION=2024-06-01

# Azure OpenAI設定（会議要約・脱線検知用）
AZURE_OPENAI_ENDPOINT=https://prod-openai.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-prod-api-key-here
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01-preview
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5
DEFAULT_TIMEZONE=Asia/Tokyo
```

---

## 4. セキュリティ考慮事項

### 4.1 秘密情報の管理

**絶対に公開してはいけない環境変数**:
- `AZURE_WHISPER_API_KEY`
- `AZURE_OPENAI_API_KEY`
- `SLACK_WEBHOOK_URL`
- `OPENAI_API_KEY`

**対策**:
1. `.env`ファイルを`.gitignore`に追加（コミット禁止）
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

2. `env.example`にはダミー値を記載
   ```bash
   AZURE_WHISPER_API_KEY=your-api-key-here
   ```

3. GitHub Secretsに秘密情報を保存（CI/CD用）
   - Settings → Secrets and variables → Actions
   - `AZURE_WHISPER_API_KEY`などをシークレットとして登録

4. 本番環境ではAWS Secrets Managerを使用
   ```python
   import boto3

   client = boto3.client('secretsmanager', region_name='ap-northeast-1')
   secret = client.get_secret_value(SecretId='prod/azure/openai/api-key')
   api_key = secret['SecretString']
   ```

### 4.2 環境変数の検証

**起動時チェック**:

`app/main.py`のlifespan関数で必須環境変数を検証:

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時チェック
    required_vars = [
        "AZURE_WHISPER_ENDPOINT",
        "AZURE_WHISPER_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
    ]

    missing_vars = [var for var in required_vars if not getattr(settings, var.lower(), "")]

    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")

    yield

app = FastAPI(lifespan=lifespan)
```

### 4.3 ログ出力時の注意

**APIキーをログに出力しない**:

```python
# 悪い例
logger.info(f"Azure OpenAI API key: {settings.azure_openai_api_key}")

# 良い例
logger.info(f"Azure OpenAI endpoint: {settings.azure_openai_endpoint}")
logger.info("Azure OpenAI API key is set")
```

---

## 5. 設定ファイルの管理

### 5.1 ローカル開発環境

**手順**:
1. `env.example`をコピーして`.env`を作成
   ```bash
   cp backend/env.example backend/.env
   ```

2. `.env`ファイルを編集してAPIキーを設定
   ```bash
   # Azure OpenAI Whisperの設定
   AZURE_WHISPER_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
   AZURE_WHISPER_API_KEY=your-actual-api-key-here

   # Azure OpenAIの設定
   AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
   AZURE_OPENAI_API_KEY=your-actual-api-key-here
   ```

3. アプリを起動
   ```bash
   cd backend
   poetry run uvicorn app.main:app --reload
   ```

### 5.2 Docker環境

**docker-compose.yml**:
```yaml
services:
  backend:
    build: ./backend
    env_file:
      - ./backend/.env
    ports:
      - "8000:8000"
```

**起動**:
```bash
docker-compose up
```

### 5.3 ECS Fargate環境

**環境変数の設定方法**:

#### 方法1: タスク定義でハードコード（非推奨）
```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "environment": [
        { "name": "APP_NAME", "value": "Facilitation AI PoC" },
        { "name": "DEBUG", "value": "false" }
      ]
    }
  ]
}
```

#### 方法2: AWS Secrets Manager（推奨）
```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "secrets": [
        {
          "name": "AZURE_WHISPER_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:prod/azure/whisper/api-key"
        },
        {
          "name": "AZURE_OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:prod/azure/openai/api-key"
        }
      ]
    }
  ]
}
```

**AWS Secrets Managerへの登録**:
```bash
aws secretsmanager create-secret \
  --name prod/azure/whisper/api-key \
  --secret-string "your-actual-api-key-here" \
  --region ap-northeast-1
```

---

## 6. トラブルシューティング

### 6.1 環境変数が読み込まれない

**症状**:
```
ValueError: Missing required environment variables: ['azure_whisper_api_key']
```

**原因**:
- `.env`ファイルが存在しない
- `.env`ファイルのパスが間違っている
- 環境変数名が間違っている

**解決方法**:
1. `.env`ファイルが`backend/`直下に存在するか確認
   ```bash
   ls -la backend/.env
   ```

2. 環境変数名を確認（大文字/小文字は区別されない）
   ```bash
   # .envファイルの内容を確認
   cat backend/.env | grep AZURE_WHISPER_API_KEY
   ```

3. Pydantic Settingsが`.env`を読み込んでいるか確認
   ```python
   from app.settings import settings
   print(settings.azure_whisper_api_key)
   ```

### 6.2 Azure OpenAI APIエラー

**症状**:
```
Error: Invalid API key or endpoint
```

**原因**:
- APIキーが間違っている
- エンドポイントURLが間違っている
- デプロイメント名が間違っている

**解決方法**:
1. Azure Portalで正しいAPIキーとエンドポイントを確認
2. 環境変数を再設定
   ```bash
   # エンドポイント確認
   echo $AZURE_WHISPER_ENDPOINT

   # APIキー確認（最初の5文字のみ表示）
   echo $AZURE_WHISPER_API_KEY | head -c 5
   ```

3. デプロイメント名を確認
   ```bash
   # Azure CLIでデプロイメント一覧を取得
   az cognitiveservices account deployment list \
     --name your-resource-name \
     --resource-group your-resource-group
   ```

### 6.3 CORS エラー

**症状**:
```
Access to fetch at 'http://localhost:8000/api/meetings' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**原因**:
- `CORS_ORIGINS`にフロントエンドのURLが含まれていない

**解決方法**:
1. `.env`ファイルで`CORS_ORIGINS`を確認
   ```bash
   CORS_ORIGINS=http://localhost:3000
   ```

2. 複数オリジンを許可する場合はカンマ区切り
   ```bash
   CORS_ORIGINS=http://localhost:3000,https://example.com
   ```

3. バックエンドを再起動
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

### 6.4 データディレクトリが作成されない

**症状**:
```
FileNotFoundError: [Errno 2] No such file or directory: './data/meetings/abc123'
```

**原因**:
- `DATA_DIR`のパスが間違っている
- ディレクトリの書き込み権限がない

**解決方法**:
1. `DATA_DIR`のパスを確認
   ```bash
   echo $DATA_DIR
   ```

2. ディレクトリを手動作成
   ```bash
   mkdir -p data/meetings
   ```

3. 書き込み権限を確認
   ```bash
   ls -ld data
   chmod 755 data
   ```

---

## 7. 環境変数の追加手順

**新しい環境変数を追加する場合**:

1. **`backend/app/settings.py`に定義を追加**
   ```python
   class Settings(BaseSettings):
       # ... 既存の定義 ...

       # 新規追加
       new_feature_api_key: str = ""
   ```

2. **`backend/env.example`にサンプルを追加**
   ```bash
   # 新機能のAPI設定
   NEW_FEATURE_API_KEY=your-api-key-here
   ```

3. **このドキュメント（environment-design.md）を更新**
   - 2章の該当セクションに環境変数を追加
   - 3章の環境別設定値を更新

4. **チーム全体に周知**
   - Slackで通知
   - README.mdを更新

---

## 8. チェックリスト

### 8.1 開発環境セットアップ時

- [ ] `env.example`をコピーして`.env`を作成
- [ ] Azure OpenAI WhisperのAPIキーを設定
- [ ] Azure OpenAIのAPIキーを設定
- [ ] `CORS_ORIGINS`にフロントエンドのURLを設定
- [ ] アプリを起動して環境変数が正しく読み込まれるか確認

### 8.2 本番環境デプロイ時

- [ ] AWS Secrets Managerに秘密情報を登録
- [ ] ECSタスク定義に環境変数を設定
- [ ] `DEBUG=false`になっているか確認
- [ ] `CORS_ORIGINS`に本番ドメインを設定
- [ ] `DATA_DIR`をEFSマウントポイントに設定
- [ ] Azure OpenAIのデプロイメント名を本番用に変更（`gpt-5`など）

### 8.3 セキュリティチェック

- [ ] `.env`ファイルが`.gitignore`に含まれているか確認
- [ ] APIキーがコードやログに出力されていないか確認
- [ ] 本番環境のAPIキーが開発環境と異なるか確認
- [ ] GitHub Secretsに秘密情報が登録されているか確認

---

## 関連ドキュメント

- [バックエンド アーキテクチャ概要](./overview.md)
- [データストレージ設計書](./storage-design.md)
- [会議管理機能 - 処理設計書](../../features/meetings/design.md)
