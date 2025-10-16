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
├── backend/          # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py           # APIエンドポイント
│   │   ├── storage.py        # JSONデータストア
│   │   └── services/         # ASR/LLM/Slack/脱線検知
│   ├── requirements.txt
│   └── run.py
│
└── frontend/         # Next.js フロントエンド（予定）
    └── src/
        ├── app/              # 画面A, B, C, D
        └── components/
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

### フロントエンド（予定）

```bash
cd frontend
npm install
npm run dev
```

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
