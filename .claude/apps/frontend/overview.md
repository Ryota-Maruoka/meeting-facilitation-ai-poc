---
title: "フロントエンド アーキテクチャ概要"
status: "active"
owner: "frontend-team"
last_update: "2025-02-11"
confidentiality: "internal"
---

# フロントエンド アーキテクチャ概要

## 1. 概要

Meeting Facilitation AI PoCのフロントエンドは、Next.js App Routerをベースとした会議ファシリテーション支援Webアプリケーションです。
リアルタイム音声文字起こし、脱線検知アラート、要約表示などのAI支援機能を提供します。

### 1.1 技術スタック

| 項目 | 技術 | バージョン | 用途 |
|------|------|-----------|------|
| フレームワーク | Next.js | 14+ | Reactフレームワーク（App Router） |
| 言語 | TypeScript | 5.5+ | 型安全性 |
| UIライブラリ | Material-UI | 7.x | UIコンポーネント |
| CSSフレームワーク | Tailwind CSS | 3.4+ | ユーティリティファーストCSS |
| 状態管理 | React Hooks | - | ローカル状態管理 |
| HTTP Client | fetch API | - | バックエンドAPI通信 |
| アイコン | Lucide React / MUI Icons | latest | アイコンセット |

### 1.2 デプロイ環境

| 環境 | プラットフォーム | 備考 |
|------|----------------|------|
| 開発環境 | ローカル（Next.js Dev Server） | `npm run dev` |
| 本番環境 | Vercel / AWS Amplify | 静的サイト + SSR |

---

## 2. アーキテクチャ構成

### 2.1 ディレクトリ構造

```
frontend/
├── src/
│   ├── app/                            # Next.js App Router（ルート定義）
│   │   ├── page.tsx                    # トップページ（会議履歴一覧）
│   │   ├── layout.tsx                  # ルートレイアウト
│   │   ├── globals.css                 # グローバルスタイル
│   │   │
│   │   ├── history/                    # 会議履歴ページ
│   │   │   └── page.tsx                # 会議履歴一覧画面
│   │   │
│   │   ├── meetings/                   # 会議関連ルート
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # 新規会議作成画面
│   │   │   └── [id]/                   # 動的ルート（会議ID）
│   │   │       ├── active/
│   │   │       │   └── page.tsx        # 会議進行中画面
│   │   │       └── summary/
│   │   │           └── page.tsx        # 会議レポート画面
│   │   │
│   │   └── api/                        # Route Handlers（必要時）
│   │       ├── health/
│   │       │   └── route.ts            # ヘルスチェック
│   │       └── meetings/
│   │           ├── route.ts            # 会議一覧
│   │           └── [id]/
│   │               └── route.ts        # 会議詳細
│   │
│   ├── components/                     # 共通コンポーネント
│   │   ├── providers/                  # Context Providers
│   │   │   ├── ThemeProvider.tsx       # Material-UIテーマ
│   │   │   └── index.tsx               # Provider統合
│   │   │
│   │   └── sections/                   # セクション単位コンポーネント
│   │       ├── LiveTranscriptArea/     # リアルタイム文字起こし表示
│   │       │   ├── LiveTranscriptArea.tsx
│   │       │   └── index.tsx
│   │       │
│   │       └── DeviationAlert/         # 脱線検知アラート
│   │           ├── DeviationAlert.tsx
│   │           └── index.tsx
│   │
│   ├── features/                       # 機能別ディレクトリ
│   │   ├── meeting-history/            # 会議履歴機能
│   │   │   ├── components/
│   │   │   │   └── MeetingHistoryList.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── meeting-active/             # 会議進行中機能
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   ├── meeting-creation/           # 会議作成機能
│   │   │   └── components/
│   │   │
│   │   └── meeting-summary/            # 会議レポート機能
│   │       └── components/
│   │
│   ├── shared/                         # 共有リソース
│   │   ├── components/                 # 共通UIコンポーネント
│   │   │   └── Toast.tsx               # トースト通知
│   │   │
│   │   ├── hooks/                      # カスタムフック
│   │   │   └── useToast.ts             # トースト通知フック
│   │   │
│   │   └── lib/                        # ユーティリティ・型定義
│   │       ├── types.ts                # TypeScript型定義
│   │       └── utils.ts                # ヘルパー関数
│   │
│   ├── hooks/                          # グローバルhooks
│   │   ├── useMeeting.ts               # 会議詳細取得・操作
│   │   ├── useMeetings.ts              # 会議一覧取得
│   │   └── useDeviationDetection.ts    # 脱線検知
│   │
│   ├── lib/                            # ライブラリ・ユーティリティ
│   │   ├── api.ts                      # APIクライアント
│   │   ├── types.ts                    # グローバル型定義
│   │   ├── constants.ts                # 定数定義
│   │   ├── utils.ts                    # ユーティリティ関数
│   │   ├── mockData.ts                 # モックデータ
│   │   └── meetingStorage.ts           # ローカルストレージ管理
│   │
│   └── styles/                         # スタイルファイル
│       ├── commonStyles.ts             # 共通スタイル定義
│       └── theme.ts                    # Material-UIテーマ
│
├── public/                             # 静的ファイル
│   └── icon.svg                        # アプリアイコン
│
├── package.json                        # 依存パッケージ
├── next.config.mjs                     # Next.js設定
├── tsconfig.json                       # TypeScript設定
├── tailwind.config.ts                  # Tailwind CSS設定
├── postcss.config.js                   # PostCSS設定
├── .env.development                    # 開発環境変数
├── .env.example                        # 環境変数サンプル
└── README.md                           # セットアップガイド
```

### 2.2 レイヤ構造

```
┌─────────────────────────────────────────┐
│  App Router (app/)                      │
│  - ルート定義                            │
│  - レイアウト                            │
│  - ページコンポーネント                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Features (features/)                   │
│  - 機能別コンポーネント                    │
│  - 機能別hooks                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Hooks (hooks/)                         │
│  - useMeeting                           │
│  - useMeetings                          │
│  - useDeviationDetection                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  API Client (lib/api.ts)                │
│  - APIクライアント                        │
│  - 型マッピング                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Backend API (http://localhost:8000)    │
│  - RESTful API                          │
└─────────────────────────────────────────┘
```

---

## 3. 主要画面

### 3.1 トップページ（会議履歴一覧）

**ルート**: `/`

**ファイル**: `app/page.tsx`

**機能**:
- 過去の会議一覧表示
- 会議検索・フィルタリング
- 新規会議作成ボタン
- 各会議へのリンク（進行中/サマリ）

**使用コンポーネント**:
- `features/meeting-history/components/MeetingHistoryList.tsx`

### 3.2 会議作成画面

**ルート**: `/meetings/new`

**ファイル**: `app/meetings/new/page.tsx`

**機能**:
- 会議メタ情報入力（タイトル、目的、期待成果）
- 参加者リスト入力
- アジェンダ項目登録
- 会議作成＆開始

**フォーム項目**:
- タイトル（必須）
- 目的（必須）
- 期待成果テンプレート（必須）
- 会議日程（任意）
- 参加者リスト（任意）
- アジェンダ（複数登録可）
  - アジェンダタイトル
  - 所要時間（分）
  - 期待成果
  - 関連URL

### 3.3 会議進行中画面

**ルート**: `/meetings/[id]/active`

**ファイル**: `app/meetings/[id]/active/page.tsx`

**機能**:
- リアルタイム音声文字起こし表示
- 脱線検知アラート
- ミニ要約表示（決定事項・未決事項・アクション）
- Parking Lotリスト
- クイック操作ボタン
  - 録音開始/停止
  - 会議終了

**主要コンポーネント**:
- `components/sections/LiveTranscriptArea/`
- `components/sections/DeviationAlert/`

**リアルタイム機能**:
- 音声録音（Web Audio API）
- 文字起こし結果のストリーミング表示
- 脱線検知の定期実行（10秒間隔）

### 3.4 会議レポート画面

**ルート**: `/meetings/[id]/summary`

**ファイル**: `app/meetings/[id]/summary/page.tsx`

**機能**:
- 会議全体の要約表示（Markdown形式）
- 決定事項一覧
- 未決事項一覧
- アクション項目一覧
- Parking Lot一覧
- Slack送信ボタン
- ダウンロード機能（Markdown/PDF）

**データ構造**:
```typescript
{
  generated_at: string,
  summary: string,
  decisions: string[],
  undecided: string[],
  actions: Array<{
    title: string,
    owner: string,
    due: string
  }>
}
```

---

## 4. データモデル（型定義）

### 4.1 Meeting（会議）

```typescript
export type Meeting = {
  id: string;
  title: string;
  purpose: string;
  expectedOutcome: string;
  meetingDate?: string; // YYYY-MM-DD形式
  participants: string[];
  status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
  agenda: AgendaItem[];
};
```

### 4.2 AgendaItem（アジェンダ項目）

```typescript
export type AgendaItem = {
  id: string;
  title: string;
  duration: number; // 分
  expectedOutcome: string;
  relatedUrl?: string;
  status: "pending" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
};
```

### 4.3 Transcript（文字起こし）

```typescript
export type Transcript = {
  id: string;
  text: string;
  timestamp: string;
  speaker?: string;
  confidence?: number;
};
```

### 4.4 DeviationAlert（脱線検知）

```typescript
export type DeviationAlert = {
  id: string;
  is_deviation: boolean;
  confidence: number;
  similarity: number;
  best_agenda: string;
  message: string;
  suggestedTopics: string[];
  recent_text: string;
  created_at: string;
  timestamp: string;
};
```

### 4.5 MeetingDetailPreview（要約プレビュー）

```typescript
export type MeetingDetailPreview = {
  generated_at: string;
  summary: string;
  decisions: string[];
  undecided: string[];
  actions: Array<{
    title: string;
    owner: string;
    due: string;
  }>;
};
```

---

## 5. APIクライアント

### 5.1 APIベースURL設定

**環境変数**: `NEXT_PUBLIC_API_BASE_URL`

**開発環境**:
```
http://localhost:8000
```

**本番環境**:
```
https://api.example.com
```

**実装**: `lib/constants.ts`
```typescript
export const API_BASE_URL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "/backend-api";
```

### 5.2 APIクライアント実装

**ファイル**: `lib/api.ts`

**主要メソッド**:

#### 会議管理
- `getMeetings()`: 会議一覧取得
- `getMeeting(id)`: 会議詳細取得
- `createMeeting(data)`: 会議作成
- `updateMeeting(id, data)`: 会議更新
- `deleteMeeting(id)`: 会議削除
- `startMeeting(id)`: 会議開始
- `endMeeting(id)`: 会議終了

#### 音声文字起こし
- `transcribeAudio(meetingId, audioFile)`: 音声ファイルアップロード＆文字起こし
- `getTranscripts(meetingId)`: 文字起こし一覧取得
- `addTranscript(meetingId, data)`: 文字起こしチャンク追加

#### 脱線検知
- `checkDeviation(meetingId)`: 脱線検知実行

#### 要約・分析
- `getSummary(meetingId)`: 要約取得
- `generateSummary(meetingId)`: 要約生成
- `getMeetingDetailPreview(meetingId)`: 会議詳細プレビュー取得

#### Parking Lot
- `addParkingItem(meetingId, content, addToNextAgenda)`: Parking Lot追加
- `getParkingItems(meetingId)`: Parking Lot一覧取得

#### Slack連携
- `sendToSlack(meetingId, webhookUrl)`: Slack送信

### 5.3 型マッピング

**Backend ↔ Frontend 型変換**:

バックエンドのレスポンス形式（snake_case + camelCase混在）をフロントエンド型（camelCase統一）に変換します。

**例**:
```typescript
private mapBackendMeetingToFrontend(backend: Record<string, unknown>): Meeting {
  return {
    id: String(backend.id),
    title: String(backend.title),
    purpose: String(backend.purpose),
    expectedOutcome: String(backend.deliverable_template ?? ""),
    meetingDate: backend.meetingDate ? String(backend.meetingDate) : undefined,
    participants: Array.isArray(backend.participants) ? backend.participants as string[] : [],
    status: (backend.status as "draft" | "active" | "completed") ?? "draft",
    created_at: String(backend.createdAt ?? backend.created_at),
    updated_at: String(backend.updatedAt ?? backend.updated_at ?? backend.createdAt ?? backend.created_at),
    // ... 以下省略
  };
}
```

---

## 6. カスタムHooks

### 6.1 useMeetings（会議一覧取得）

**ファイル**: `hooks/useMeetings.ts`

**機能**:
- 会議一覧を取得
- ローディング状態管理
- エラーハンドリング

**使用例**:
```typescript
const { meetings, loading, error, refetch } = useMeetings();
```

### 6.2 useMeeting（会議詳細取得・操作）

**ファイル**: `hooks/useMeeting.ts`

**機能**:
- 会議詳細を取得
- 会議開始・終了
- 会議更新
- 文字起こし追加
- 要約取得

**使用例**:
```typescript
const {
  meeting,
  loading,
  error,
  startMeeting,
  endMeeting,
  addTranscript,
  getSummary
} = useMeeting(meetingId);
```

### 6.3 useDeviationDetection（脱線検知）

**ファイル**: `hooks/useDeviationDetection.ts`

**機能**:
- 定期的な脱線検知実行（10秒間隔）
- アラート状態管理
- アラートのクリア

**使用例**:
```typescript
const {
  alert,
  isChecking,
  checkDeviation,
  clearAlert
} = useDeviationDetection(meetingId, isActive);
```

---

## 7. スタイリング

### 7.1 Material-UI テーマ

**ファイル**: `styles/theme.ts`

**主要設定**:
- カラーパレット（primary, secondary, error, warning, info, success）
- タイポグラフィ
- コンポーネントデフォルトプロパティ

**適用**: `components/providers/ThemeProvider.tsx`

### 7.2 Tailwind CSS

**設定ファイル**: `tailwind.config.ts`

**使用方針**:
- ユーティリティクラスでのレイアウト調整
- Material-UIと併用
- レスポンシブデザイン対応

### 7.3 共通スタイル

**ファイル**: `styles/commonStyles.ts`

**定義内容**:
- ボタンスタイル
- カードスタイル
- フォームスタイル
- レイアウトスタイル

---

## 8. 環境変数

### 8.1 環境変数ファイル

| ファイル名 | Git管理 | 用途 |
|-----------|--------|------|
| `.env.example` | ✓ | 環境変数のテンプレート |
| `.env.development` | ✓ | 開発環境固有の設定（非機密情報のみ） |
| `.env.production` | ✓ | 本番環境固有の設定（非機密情報のみ） |
| `.env.local` | ✗ | ローカル環境の機密情報（**Git管理外**） |

### 8.2 環境変数定義

#### Backend API接続先（必須）

```env
# クライアントサイド（ブラウザ）で使用
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**注意**:
- `NEXT_PUBLIC_`プレフィックスの変数は**クライアント側のJavaScriptで利用可能**
- **機密情報を含めないでください**

---

## 9. 状態管理

### 9.1 状態管理方針

- **ローカル状態**: React Hooks（`useState`, `useEffect`）
- **グローバル状態**: Context API（必要に応じて）
- **サーバー状態**: カスタムhooks（`useMeeting`, `useMeetings`）

### 9.2 状態フロー

```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook (useMeeting / useMeetings)
    ↓
API Client (lib/api.ts)
    ↓
Backend API
    ↓
Response
    ↓
State Update (useState)
    ↓
Component Re-render
```

---

## 10. リアルタイム機能

### 10.1 音声録音

**実装**: Web Audio API

**フロー**:
1. マイク権限取得（`navigator.mediaDevices.getUserMedia`）
2. 音声ストリーム取得
3. MediaRecorderで録音開始
4. 音声データをBlobとして保存
5. バックエンドAPIに送信（`/meetings/{id}/transcribe`）

### 10.2 脱線検知

**実装**: `useDeviationDetection` hook

**フロー**:
1. 会議進行中に10秒間隔で脱線検知API呼び出し
2. バックエンドがアジェンダとの類似度を計算
3. 脱線判定（閾値未満）の場合、アラート表示
4. ユーザーが「軌道修正」「Parking Lot」「無視」を選択

---

## 11. エラーハンドリング

### 11.1 APIエラー

**実装**: `lib/api.ts`

**エラー処理**:
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error("API request failed:", error);
  throw error;
}
```

### 11.2 UIエラー表示

**実装**: `shared/components/Toast.tsx`, `shared/hooks/useToast.ts`

**使用例**:
```typescript
const { showToast } = useToast();

try {
  await apiClient.createMeeting(data);
  showToast("会議を作成しました", "success");
} catch (error) {
  showToast("会議の作成に失敗しました", "error");
}
```

---

## 12. パフォーマンス最適化

### 12.1 初回コンパイル時間の短縮

**課題**: Material-UIを使用しているページは初回コンパイルに1分程度かかる

**対策**:
1. ファイルシステムキャッシュを活用（`.next/cache`を削除しない）
2. ソースマップを無効化（`.env.development`で`GENERATE_SOURCEMAP=false`）
3. 開発サーバー起動直後によく使うページにアクセスしてコンパイル

### 12.2 バンドルサイズ最適化

**対策**:
- 動的インポート（`next/dynamic`）の活用
- 不要なライブラリの除外
- Tree Shaking有効化

---

## 13. セキュリティ

### 13.1 現在の実装

- **CORS**: バックエンド側で許可オリジン制限
- **XSS対策**: Reactのデフォルトエスケープ
- **環境変数**: `.env.local`を`.gitignore`に登録

### 13.2 将来的な改善

- 認証・認可（Cognito統合）
- CSRF対策（Double-Submit Cookie）
- セキュリティヘッダー追加
- Content Security Policy（CSP）設定

---

## 14. 開発規約

### 14.1 コーディングスタイル

- **Linter**: ESLint
- **Formatter**: Prettier
- **型チェック**: TypeScript strict mode

### 14.2 ファイル命名規約

- **コンポーネント**: PascalCase（`MeetingHistoryList.tsx`）
- **hooks**: camelCase（`useMeeting.ts`）
- **ユーティリティ**: camelCase（`utils.ts`）

### 14.3 コンポーネント設計

- **単一責任**: 1コンポーネント = 1機能
- **Props**: 最大8プロパティ
- **再利用性**: 共通コンポーネントは`shared/components/`に配置

---

## 15. 今後の改善課題

### 15.1 認証・認可

- Cognito統合
- ログイン/ログアウト
- セッション管理

### 15.2 パフォーマンス

- Server Components活用
- 画像最適化（`next/image`）
- CDN活用

### 15.3 テスト

- Jestユニットテスト
- Playwrightエンドツーエンドテスト
- Storybook導入

### 15.4 アクセシビリティ

- ARIA属性追加
- キーボードナビゲーション
- スクリーンリーダー対応

---

## 関連ドキュメント

- [フロントエンドREADME](../../frontend/README.md)
- [バックエンドアーキテクチャ概要](../backend/overview.md)
- [プロジェクトREADME](../../README.md)
