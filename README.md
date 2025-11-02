# Meeting Facilitation AI PoC

会議ファシリテーションを支援するAIアプリケーションのPoC実装です。

## 概要

このプロジェクトは、会議の効率化と質の向上を目的としたAIファシリテーションツールです。以下の機能を提供します：

### 主要機能

- **F1: 音声文字起こし** - 会議音声をリアルタイムまたは録音から文字起こし
- **F2: 一定間隔の要約生成** - 3分程度のウィンドウで要約を自動更新
- **F3: 未決事項の抽出** - 決まっていない議題を自動検出しリスト化
- **F4: 決定に繋がる提案生成** - 未決事項に対する次のアクション候補を提示
- **F5: 脱線検知アラート** - アジェンダからの逸脱を検知して通知
- **F9: 決定ログ** - 会議中の決定事項を確定記録
- **F10: アクション管理** - タスクを担当者と期限付きで登録
- **F11: 会議後サマリ生成** - 会議終了時にMarkdown形式でサマリを自動生成
- **F16: Parking Lot** - 脱線トピックを退避し後で再確認

## プロジェクト構成

```
meeting-facilitation-ai-poc/
├── backend/                                # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py                         # エントリーポイント（FastAPI起動）
│   │   ├── settings.py                     # 設定管理（pydantic-settings）
│   │   ├── storage.py                      # JSONファイルを扱う軽量データストア
│   │   │
│   │   ├── schemas/                        # Pydanticモデル（データ構造定義）
│   │   │   ├── __init__.py
│   │   │   ├── meeting.py                  # Meeting, MeetingCreate, AgendaItem
│   │   │   ├── transcript.py               # TranscriptChunk（文字起こし結果）
│   │   │   ├── summary.py                  # MiniSummary, Decision, ActionItem
│   │   │   ├── parking.py                  # ParkingItem
│   │   │   └── slack.py                    # SlackPayload
│   │   │
│   │   ├── routers/                        # APIルーター（機能別エンドポイント）
│   │   │   ├── __init__.py
│   │   │   ├── meetings.py                 # 会議CRUD（作成・取得・更新）
│   │   │   ├── transcripts.py              # 音声文字起こし（Whisper連携）
│   │   │   ├── summaries.py                # 要約・分析・脱線検知
│   │   │   ├── decisions.py                # 決定事項・アクション項目
│   │   │   ├── parking.py                  # Parking Lot（後回し項目管理）
│   │   │   └── slack.py                    # Slack通知・連携処理
│   │   │
│   │   ├── services/                       # 各種業務ロジック
│   │   │   ├── asr.py                      # 音声認識サービス（Azure Whisper / Python Whisper）
│   │   │   ├── azure_whisper_service.py    # Azure OpenAI Whisper API連携
│   │   │   ├── deviation.py                # 脱線検知サービス（従来手法）
│   │   │   ├── ai_deviation.py             # AI脱線検知サービス（LLM使用）
│   │   │   ├── llm.py                      # LLM（GPT）要約・未決事項抽出・提案生成
│   │   │   ├── meeting_scheduler.py         # 会議中の自動要約生成スケジューラー
│   │   │   └── slack.py                     # Slack API連携
│   │   │
│   │   ├── meeting_summarizer/             # 会議要約生成モジュール
│   │   │   ├── service.py                  # 要約生成ロジック
│   │   │   ├── preprocess.py              # 前処理
│   │   │   ├── presenter.py               # 結果整形
│   │   │   ├── schema.py                  # 要約データ構造
│   │   │   └── cli.py                     # CLIインターフェース
│   │   │
│   │   ├── core/                           # 共通ユーティリティ
│   │   │   ├── __init__.py
│   │   │   └── exceptions.py               # カスタム例外定義
│   │   │
│   │   └── data/                           # データディレクトリ
│   │       └── meetings/                   # 会議データ（JSONファイル）
│   │
│   ├── requirements.txt                    # Python依存パッケージ
│   └── run.py                              # ローカル実行スクリプト
│
└── frontend/                               # Next.js フロントエンド（App Router）
    └── src/
        ├── app/                            # ルーティング（Next.js App Router）
        │   ├── page.tsx                    # トップページ: 会議履歴一覧
        │   ├── layout.tsx                  # ルートレイアウト
        │   ├── globals.css                 # グローバルスタイル
        │   ├── history/
        │   │   └── page.tsx                # 履歴ページ（トップへリダイレクト）
        │   ├── meetings/                   # 会議関連ルート
        │   │   ├── new/
        │   │   │   └── page.tsx            # 新規会議作成画面
        │   │   └── [id]/                   # 動的ルート（会議ID）
        │   │       ├── active/
        │   │       │   └── page.tsx        # 会議進行中画面
        │   │       └── summary/
        │   │           └── page.tsx        # 会議レポート画面
        │   └── api/                        # Next.js APIルート
        │       ├── health/
        │       │   └── route.ts             # ヘルスチェック
        │       └── meetings/
        │           ├── route.ts             # 会議一覧・作成API
        │           └── [id]/
        │               └── route.ts         # 会議詳細・更新・削除API
        │
        ├── components/                     # コンポーネント
        │   ├── providers/                  # プロバイダーコンポーネント
        │   │   ├── ThemeProvider.tsx       # MUIテーマプロバイダー
        │   │   └── index.tsx
        │   └── sections/                   # セクションコンポーネント
        │       ├── DeviationAlert/          # 脱線アラート表示
        │       │   ├── DeviationAlert.tsx
        │       │   └── index.tsx
        │       └── LiveTranscriptArea/     # ライブ文字起こし表示
        │           ├── LiveTranscriptArea.tsx
        │           └── index.tsx
        │
        ├── hooks/                          # カスタムフック
        │   ├── useMeetings.ts              # 会議一覧取得フック
        │   ├── useMeeting.ts               # 会議詳細取得フック
        │   └── useDeviationDetection.ts    # 脱線検知フック
        │
        ├── lib/                            # ユーティリティ・型定義
        │   ├── types.ts                    # TypeScript型定義
        │   ├── api.ts                      # API クライアント
        │   ├── constants.ts                # 定数定義
        │   ├── time.ts                     # 時刻フォーマット関数
        │   └── meetingStorage.ts           # 会議データストレージ（API連携）
        │
        ├── shared/                         # 共通リソース
        │   ├── components/                 # 共通UIコンポーネント
        │   │   └── Toast.tsx               # トースト通知コンポーネント
        │   ├── hooks/                      # 共通カスタムフック
        │   │   └── useToast.ts             # トースト通知フック
        │   └── lib/                        # 共通ユーティリティ
        │       └── utils.ts                # ヘルパー関数（formatDate等）
        │
        └── styles/                         # スタイルファイル
            ├── commonStyles.ts             # 共通スタイル定義
            └── theme.ts                    # Material-UIテーマ
```

### フロントエンド構造の特徴

#### 1. App Router パターン
- Next.js 14+のApp Routerを採用
- `app/`ディレクトリ内の`page.tsx`が各ルートのページコンポーネント
- ファイル名は固定（`page.tsx`, `layout.tsx`, `route.ts`など）
- `app/api/`配下でNext.js APIルートを提供（バックエンドAPIのプロキシとして機能）

#### 2. コンポーネント構造
- `components/providers/` - プロバイダーコンポーネント（テーマ等）
- `components/sections/` - セクションレベルコンポーネント（脱線アラート、ライブ文字起こし等）
- 各コンポーネントは`index.tsx`でエクスポートし、ディレクトリ単位で管理

#### 3. カスタムフック
- `hooks/`配下に機能別のカスタムフックを配置
- `useMeetings`, `useMeeting`, `useDeviationDetection`など
- データ取得ロジックとUIロジックを分離

#### 4. 共有リソース（Shared）
- `shared/components/` - 共通UIコンポーネント（Toast通知等）
- `shared/hooks/` - 共通カスタムフック（useToast等）
- `shared/lib/` - 共通ユーティリティ関数
- 機能横断的な再利用可能なコードを集約

#### 5. 型定義とAPIクライアント
- `lib/types.ts` - アプリ全体で使用する型定義を一元管理
- `lib/api.ts` - バックエンドAPIとの通信を統一管理
- `lib/time.ts` - 時刻フォーマット関数を集約

#### 6. わかりやすいページコメント
- 各`page.tsx`の冒頭に詳細なコメントを記載
- URL、機能、関連ファイルを明記
- 何のファイルか一目で判別可能

```

## セットアップ

### 前提条件

- **Python 3.11以上**
- **Node.js 18以上**
- **FFmpeg**（音声変換用）
- **Git**

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd meeting-facilitation-ai-poc
```

### 2. バックエンドセットアップ

```bash
cd backend

# 仮想環境作成
python -m venv .venv

# 仮想環境有効化（Windows）
.\.venv\Scripts\Activate.ps1

# 仮想環境有効化（macOS/Linux）
source .venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt
pip install python-multipart

# 環境変数ファイル作成
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux
```

### 3. 音声文字起こし機能のセットアップ

音声文字起こし機能を使用するには、以下のファイルが必要です：

#### 3.1 Whisper.cppファイルのダウンロード

**自動セットアップ（推奨）:**
```bash
# ワンコマンドで必要なファイルを自動ダウンロード
python setup_whisper.py
```

**手動セットアップ:**
```bash
# 1. Whisper.cpp実行ファイルをダウンロード
# https://github.com/ggerganov/whisper.cpp/releases
# 最新のWindows版（main.exe）をダウンロードしてbackend/に配置

# 2. モデルファイルをダウンロード（約1.5GB）
python -c "
import urllib.request
import os
os.makedirs('whisper-cpp/models', exist_ok=True)
urllib.request.urlretrieve('https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin', 'whisper-cpp/models/ggml-base.bin')
"
```

#### 3.2 FFmpegのインストール

**Windows（winget 推奨）:**
```bash
# winget でインストール（推奨）
winget install Gyan.FFmpeg

# または手動インストール
# https://ffmpeg.org/download.html からダウンロード
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### 4. 動作確認

```bash
# バックエンドサーバー起動
python run.py server

# 別のターミナルで音声認識テスト
python test_whisper.py

# または、API接続テスト
python test_api.py
```

### 5. フロントエンドセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 初期データファイルの準備
# meetings.sample.jsonをコピーしてmeetings.jsonを作成
cp data/meetings/meetings.sample.json data/meetings/meetings.json
# Windowsの場合:
# copy data\meetings\meetings.sample.json data\meetings\meetings.json

# 開発サーバー起動
npm run dev
```

### 6. 一括起動（推奨）

フロントエンドとバックエンドを同時に起動する便利なスクリプトを用意しています。

#### Windows (PowerShell)
```powershell
# PowerShellスクリプトを実行
.\local-run.ps1

# またはバッチファイルをダブルクリック
.\local-run.bat
```

#### Git Bash / WSL / macOS / Linux
```bash
# 実行権限を付与（初回のみ）
chmod +x local-run.sh

# スクリプトを実行
./local-run.sh
```

**起動されるサービス:**
- バックエンドAPI: http://localhost:8000
- フロントエンド: http://localhost:3000

**終了方法:**
- PowerShell版: 各ウィンドウで `Ctrl+C` を押す
- Bash版: スクリプト実行中のターミナルで `Ctrl+C` を押す

### 7. 個別起動

一括起動スクリプトを使わない場合は、以下のように個別に起動します。

#### バックエンド起動
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # macOS/Linux
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### フロントエンド起動
```bash
cd frontend
npm run dev
```

### 8. アクセス確認

- **バックエンドAPI**: http://localhost:8000/docs
- **フロントエンド**: http://localhost:3000

## 音声文字起こし機能の使用方法

### 1. 会議作成
1. フロントエンドで会議を作成

### 2. 音声録音・文字起こし
1. 「会議開始」ボタンをクリック
2. 音声を話す
3. 自動的に文字起こしが実行される

### 3. 結果確認
- リアルタイムで文字起こし結果が表示される
- 要約・未決事項・決定事項が自動生成される

## トラブルシューティング

### よくある問題

#### 1. `main.exe`が見つからない
```bash
# Whisper.cpp実行ファイルをダウンロード
# https://github.com/ggerganov/whisper.cpp/releases
# ファイルをbackend/ディレクトリに配置
```

#### 2. モデルファイルが見つからない
```bash
# 自動セットアップスクリプトを実行
python setup_whisper.py

# または手動でダウンロード
python -c "
import urllib.request
import os
os.makedirs('whisper-cpp/models', exist_ok=True)
urllib.request.urlretrieve('https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin', 'whisper-cpp/models/ggml-base.bin')
"
```

#### 3. FFmpegが見つからない
```bash
# FFmpegをインストール
# Windows: winget install Gyan.FFmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

#### 4. 仮想環境が認識されない
```bash
# 仮想環境を再作成
rm -rf .venv  # macOS/Linux
# rmdir /s .venv  # Windows
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .\.venv\Scripts\Activate.ps1  # Windows
```

### ログ確認

```bash
# バックエンドログを確認
python run.py

# 音声認識テストを実行
python test_whisper.py
```

#### データ永続化について
現在、データベースを使用せず、JSONファイル（`frontend/data/meetings/meetings.json`）でデータを管理しています。
- 会議の作成・更新・削除はすべてこのJSONファイルに保存されます
- `meetings.sample.json`は初期データのサンプルファイルです
- `meetings.json`は`.gitignore`に追加されているため、各環境で独立して管理されます

## 技術スタック

### バックエンド
- **Python 3.11+**
- **FastAPI** - 高速なWeb APIフレームワーク
- **Uvicorn** - ASGIサーバー
- **Pydantic** - データバリデーション
- **httpx** - HTTP クライアント（Slack連携）

### フロントエンド（予定）
- **Next.js 14+** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント

### AI/ML
- **Azure OpenAI Whisper API** - 音声文字起こし（クラウド、高精度）
- **Azure OpenAI API** - 要約・未決事項抽出・提案生成（GPT-5 mini使用）

## API エンドポイント

### 会議管理
- `POST /meetings` - 会議作成
- `GET /meetings/{id}` - 会議取得

### 文字起こし（F1）
- `POST /meetings/{id}/transcribe` - 音声ファイルアップロード
- `POST /meetings/{id}/transcripts` - 文字起こしチャンク追加
- `GET /meetings/{id}/transcripts` - 文字起こし一覧

### 要約・分析
- `POST /meetings/{id}/summaries/generate` - ミニ要約生成（F2）
- `POST /meetings/{id}/unresolved/extract` - 未決事項抽出（F3）
- `POST /meetings/{id}/proposals/generate` - 提案生成（F4）
- `POST /meetings/{id}/deviation/check` - 脱線検知（F5）

### 決定・アクション
- `POST /meetings/{id}/decisions` - 決定追加（F9）
- `GET /meetings/{id}/decisions` - 決定一覧
- `POST /meetings/{id}/actions` - アクション追加（F10）
- `GET /meetings/{id}/actions` - アクション一覧

### Parking Lot（F16）
- `POST /meetings/{id}/parking` - Parking Lot追加
- `GET /meetings/{id}/parking` - Parking Lot一覧

### サマリ・連携
- `POST /meetings/{id}/summary/final` - 最終サマリ生成（F11）
- `POST /slack/send` - Slack送信

## 画面構成

### 画面A: 会議作成
- 会議メタ情報入力（タイトル、目的、成果物テンプレート）
- アジェンダ登録

### 画面B: 会議中
- ライブ字幕表示
- ミニ要約（決定/未決/アクション）
- 脱線アラート
- Parking Lotリスト
- クイック操作ボタン

### 画面C: 脱線モーダル
- 脱線内容表示
- 軌道修正/Parking Lot/無視の選択

### 画面D: 会議後サマリ
- Markdown形式のサマリ
- Slack送信ボタン
- ダウンロード機能

## 開発状況

- [x] バックエンドAPI実装（F1-F5, F9-F11, F16, F18）
- [x] JSONデータストア
- [x] Whisper.cpp音声文字起こし機能
- [x] 音声形式変換（WebM → WAV）
- [x] フロントエンド実装（基本機能）
- [x] リアルタイム音声録音・文字起こし
- [x] Azure OpenAI API連携（要約・未決事項抽出・提案生成）
- [ ] デプロイ設定

## ライセンス

MIT License（または適切なライセンスを選択してください）

## 貢献

このプロジェクトはPoC段階です。フィードバックや改善提案を歓迎します。

## 連絡先

プロジェクトに関する質問や提案は、GitHubのIssuesでお願いします。
