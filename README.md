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
- **F18: 録音同意・権限管理** - 録音・文字起こしに関するユーザー同意を取得

## プロジェクト構成

```
meeting-facilitation-ai-poc/
├── backend/                                # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py                         # エントリーポイント（FastAPI起動）
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
│   │   │   ├── asr_service.py              # Whisper.cpp / OpenAI Whisper 呼び出し
│   │   │   ├── llm_service.py              # LLM（GPT）要約・脱線検知
│   │   │   ├── slack_service.py            # Slack API連携
│   │   │   └── parking_service.py          # Parking管理ロジック
│   │   │
│   │   ├── core/                           # 共通ユーティリティ（設定・ログ等）
│   │   │   ├── config.py
│   │   │   ├── logger.py
│   │   │   └── utils.py
│   │   │
│   │   └── storage.py                      # JSONファイルを扱う軽量データストア
│   │
│   ├── whisper-cpp/                        # Whisper.cpp バイナリとモデル
│   │   ├── main.exe                        # Whisper実行ファイル
│   │   └── models/
│   │       └── ggml-base.bin               # Whisperモデル
│   │
│   ├── requirements.txt                    # Python依存パッケージ
│   ├── run.py                              # ローカル実行スクリプト
│   └── .gitignore                          # Whisperモデル・音声ファイル除外
│
└── frontend/                               # Next.js フロントエンド（App Router）
    └── src/
        ├── app/                            # ルーティング（Next.js App Router）
        │   ├── page.tsx                    # トップページ: 会議履歴一覧
        │   ├── layout.tsx                  # ルートレイアウト
        │   ├── globals.css                 # グローバルスタイル
        │   └── meetings/                   # 会議関連ルート
        │       ├── new/
        │       │   └── page.tsx            # 新規会議作成画面
        │       └── [id]/                   # 動的ルート（会議ID）
        │           ├── active/
        │           │   └── page.tsx        # 会議進行中画面
        │           └── summary/
        │               └── page.tsx        # 会議レポート画面
        │
        ├── features/                       # 機能別ディレクトリ（推奨パターン）
        │   ├── meeting-history/            # 会議履歴機能
        │   │   ├── components/
        │   │   │   └── MeetingHistoryList.tsx
        │   │   └── hooks/
        │   ├── meeting-active/             # 会議進行中機能
        │   │   ├── components/
        │   │   └── hooks/
        │   ├── meeting-creation/           # 会議作成機能
        │   │   └── components/
        │   └── meeting-summary/            # 会議レポート機能
        │       └── components/
        │
        ├── shared/                         # 共通リソース
        │   ├── components/                 # 共通UIコンポーネント
        │   ├── hooks/                      # カスタムフック
        │   └── lib/                        # ユーティリティ・型定義
        │       ├── types.ts                # TypeScript型定義
        │       ├── utils.ts                # ヘルパー関数
        │       ├── constants.ts            # 定数定義
        │       └── api.ts                  # API クライアント
        │
        └── styles/                         # スタイルファイル
            ├── commonStyles.ts             # 共通スタイル定義
            └── theme.ts                    # Material-UIテーマ
```

### フロントエンド構造の特徴

#### 1. App Router パターン
- Next.js 13+のApp Routerを採用
- `app/`ディレクトリ内の`page.tsx`が各ルートのページコンポーネント
- ファイル名は固定（`page.tsx`, `layout.tsx`など）

#### 2. 機能別ディレクトリ（Features）
- 各機能を`features/`配下に独立したモジュールとして配置
- 機能ごとにコンポーネント、フック、ユーティリティを集約
- スケーラブルで保守性の高い構造

#### 3. 共有リソース（Shared）
- アプリ全体で使用する共通要素を`shared/`に配置
- 型定義、ユーティリティ関数、共通コンポーネントなど
- 機能横断的な再利用可能なコード

#### 4. わかりやすいページコメント
- 各`page.tsx`の冒頭に詳細なコメントを記載
- URL、機能、関連ファイルを明記
- 何のファイルか一目で判別可能

```

## セットアップ

### バックエンド

```bash
cd backend

# (任意) 実行ポリシー調整（有効化時にブロックされる場合のみ）
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 仮想環境作成（推奨: 3.11）※未導入なら先に 3.11 をインストール
py -3.11 -m venv .venv
# 3.13 利用時は: py -3.13 -m venv .venv

# 仮想環境有効化
.\.venv\Scripts\Activate.ps1

# 依存関係インストール（フォーム/ファイル受付の必須: python-multipart）
pip install -r requirements.txt
pip install python-multipart

# 環境変数ファイル
copy .env.example .env

# サーバ起動
python run.py
```

サーバーが起動したら http://localhost:8000/docs でSwagger UIにアクセスできます。

### フロントエンド

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

フロントエンドが起動したら http://localhost:3000 にアクセスできます。

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

### AI/ML（スタブ実装）
- **Whisper** - 音声文字起こし（予定）
- **GPT-4o mini / Claude 3.5** - 要約・提案生成（予定）

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
- 録音同意チェックボックス（F18）

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
- [x] サービススタブ（ASR/LLM/Slack/脱線検知）
- [ ] フロントエンド実装
- [ ] 実際のWhisper/LLM API連携
- [ ] デプロイ設定

## ライセンス

MIT License（または適切なライセンスを選択してください）

## 貢献

このプロジェクトはPoC段階です。フィードバックや改善提案を歓迎します。

## 連絡先

プロジェクトに関する質問や提案は、GitHubのIssuesでお願いします。
