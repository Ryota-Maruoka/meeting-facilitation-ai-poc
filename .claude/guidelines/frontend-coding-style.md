# フロントエンド コーディングルール

## 0) スタック方針（固定）

| 項目    | ルール                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------- |
| ランタイム | **Next.js 15（App Router, RSC デフォルト）**                                                               |
| UI    | **shadcn/ui + Tailwind**（色は design token / variants）                                                |
| 認証    | **next-auth（OIDC）** `strategy:"jwt"`、Cookie: `Domain=.example.com; HttpOnly; Secure; SameSite=None` |
| データ取得 | **SWR**（CSR領域で第一選択。RSCのみの画面はサーバフェッチ可）                                                               |
| フォーム  | **react-hook-form（RHF）**、必要なら zod                                                                   |
| API   | **OpenAPI Generator（TypeScript）** 生成物を使用（**直編集禁止**）＋薄いラッパで fetch 設定統一                               |
| 状態管理  | 原則 **SWR + URL クエリ**。グローバル状態ライブラリは導入しない                                                             |

---

## 1) 記載方法（Notation）

* 以降は **tree 形式**で記述します。
* 行末の【区分】に**ファイル分離ポリシー**を明示します：

  * **【\[ONE]】** … 原則 **単一ファイル**
  * **【\[PER-FEATURE]】** … **機能（モジュール）ごとに分割**
  * **【\[PER-PAGE]】** … **画面（list/show/edit等）ごとに分割**
  * **【\[MANY]】** … 複数ファイル（分類固定せず増える）

命名トークン：

* `<feature>` … 機能名（例: `projects`）
* `<Feature>` … 機能名の PascalCase（例: `Projects`）
* `<page>` … `list` / `show` / `edit` / `create` / `bulk` 等
* `<fe-root>` … `frontend_user` **または** `frontend_admin`

---

## 2) ルートディレクトリ & ディレクトリ構成（分離ポリシー内蔵）

> 両フロント（ユーザー/管理）とも**同じ構造**を採用。差分は `app/(segments)` と権限制御で吸収。

```
<fe-root>/
├─ package.json                                    【[ONE]】
├─ next.config.mjs                                 【[ONE]】
├─ tsconfig.json                                   【[ONE]】
├─ postcss.config.mjs                              【[ONE]】
├─ tailwind.config.ts                              【[ONE]】
├─ .eslintrc.cjs / .prettierrc                     【[ONE]】
└─ src/
   ├─ app/                                         【Next.js ルート（薄く保つ）】
   │  ├─ (public-pages)/                           【[MANY] 公開ページのルート・レイアウト】
   │  │  └─ page.tsx                               【[ONE]  ルート：features を呼ぶだけ】
   │  ├─ (auth)/                                   【[MANY] 認証関連（サインイン等）】
   │  │  └─ signin/page.tsx                        【[ONE]】
   │  ├─ <feature>/                                【[PER-FEATURE] ルート→features/components の組立のみ】
   │  │  ├─ page.tsx                               【[PER-PAGE] list を呼ぶ】
   │  │  ├─ [id]/page.tsx                          【[PER-PAGE] show を呼ぶ】
   │  │  └─ [id]/edit/page.tsx                     【[PER-PAGE] edit を呼ぶ】
   │  ├─ layout.tsx                                【[ONE]  グローバルレイアウト】
   │  ├─ error.tsx / loading.tsx                   【[ONE]】
   │  └─ api/                                      【[MANY] Route Handlers（必要時のみ/RSC側）】
   │
   ├─ features/                                    【機能別の中核（UI/ロジックの大半）】
   │  └─ <feature>/
   │     ├─ components/                            【[PER-PAGE] 画面コンポーネントを page 単位に分割】
   │     │  ├─ list/
   │     │  │  ├─ ListPage.tsx                     【[ONE]  画面の器：組立・責務の起点】
   │     │  │  ├─ Table.tsx                        【[ONE]】
   │     │  │  └─ Filters.tsx                      【[ONE]】
   │     │  ├─ show/
   │     │  │  ├─ ShowPage.tsx                     【[ONE]】
   │     │  │  └─ Summary.tsx                      【[ONE]】
   │     │  └─ edit/
   │     │     ├─ EditPage.tsx                     【[ONE]】
   │     │     ├─ Form.tsx                         【[ONE]  RHF起点】
   │     │     └─ fields/                          【[MANY] RHF×shadcn の入力群】
   │     │        ├─ NameField.tsx                 【[ONE]】
   │     │        └─ PriceField.tsx                【[ONE]】
   │     ├─ hooks/
   │     │  ├─ use<Feature>.ts                     【[ONE]  詳細取得（SWR）】
   │     │  ├─ use<Feature>s.ts                    【[ONE]  一覧取得（SWR）】
   │     │  └─ useMutate<Feature>.ts               【[ONE]  作成/更新/削除（SWR mutate）】
   │     ├─ types/
   │     │  └─ index.ts                            【[ONE]  生成型の再エクスポートと補助型】
   │     ├─ utils/
   │     │  └─ mapping.ts                          【[ONE]  UI↔API 変換/フォーマット】
   │     └─ index.ts                               【[ONE]  エントリ（import 集約）】
   │
   ├─ lib/
   │  ├─ api/                                      【[MANY] OpenAPI 生成物（**直編集禁止**）】
   │  ├─ api-client.ts                              【[ONE]  生成クライアントの薄いラッパ（baseURL/headers/cred）】
   │  ├─ auth/
   │  │  ├─ auth-options.ts                         【[ONE]  next-auth 設定（プロバイダ/OIDC）】
   │  │  └─ server-guards.ts                        【[ONE]  getServerSession ラッパ/HOC】
   │  ├─ swr/
   │  │  ├─ keys.ts                                 【[ONE]  SWRキーFactory（生文字列禁止）】
   │  │  └─ config.ts                               【[ONE]  既定設定（revalidateOnFocus 等）】
   │  ├─ form/
   │  │  ├─ resolvers.ts                            【[ONE]  RHF resolver（zod 連携等）】
   │  │  └─ helpers.ts                              【[ONE]  エラーマッピング】
   │  └─ ui/                                        【[MANY] 共有 UI（shadcn 拡張/レイアウト）】
   │
   ├─ shared/
   │  ├─ components/                                【[MANY] 完全共通 UI（トースト等）】
   │  ├─ icons/                                     【[MANY]】
   │  ├─ constants/                                 【[MANY]】
   │  └─ i18n/                                      【[MANY]】
   │
   ├─ styles/                                       【[MANY] Tailwind, globals.css】
   ├─ env.d.ts / types.d.ts                         【[ONE]】
   └─ middleware.ts                                 【[ONE]  認証/Cookie/地域設定の前段（必要時）】
```

**方針のポイント**

* `app/` は**薄い**：ルート定義と layout・エラーハンドリングのみ。画面ロジックは **features/** に集約。
* 画面は **`features/<feature>/components/<page>/`** 直下に配置（list/show/edit など）。
* OpenAPI 生成物は `lib/api/` に固定し、**直編集禁止**。fetch 設定は `lib/api-client.ts` に一元化。

---

## 3) 画面責務 & 命名規約（固定）

| 対象       | ルール                                                               |      |      |        |                           |
| -------- | ----------------------------------------------------------------- | ---- | ---- | ------ | ------------------------- |
| 画面ディレクトリ | \*\*\`components/{list                                            | show | edit | create | bulk}\`\*\* を基本形、必要に応じて追加 |
| ルート      | `app/<feature>/**` は **features の画面コンポーネントを組み立てるだけ**              |      |      |        |                           |
| コンポーネント  | **PascalCase**、原則 1 ファイル 1 コンポーネント（`ListPage.tsx`, `Form.tsx` など） |      |      |        |                           |
| Hooks    | **`useXxx.ts`** 命名。取得（SWR）と更新（mutate）を分離                          |      |      |        |                           |
| 型        | 生成型を **再エクスポート**。補助型は `features/<feature>/types/`                 |      |      |        |                           |
| CSS      | Tailwind。クラス合成は `cn()`。色は token。variant は **cva** 管理              |      |      |        |                           |

---

## 4) SWR 規約（固定）

| 項目    | ルール                                                                    |
| ----- | ---------------------------------------------------------------------- |
| Fetch | **`lib/api-client.ts` に集約**（`baseURL`, 標準ヘッダ, `credentials:"include"`） |
| キー設計  | **`lib/swr/keys.ts` の Factory**を経由（生文字列禁止）                             |
| 再検証   | 既定 `revalidateOnFocus:false`。必要箇所のみ有効化                                 |
| 楽観更新  | 一覧・詳細 **両方のキーを mutate**                                                |
| 状態UI  | `Alert`（エラー）/ 空状態ビュー / `Skeleton` を標準化                                 |

---

## 5) フォーム（RHF 前提）

| 項目    | ルール                                                   |
| ----- | ----------------------------------------------------- |
| 起点    | `components/<page>/Form.tsx` を画面フォームの起点               |
| フィールド | `components/<page>/fields/*` に **RHF×shadcn** の入力群    |
| 検証    | **zod + @hookform/resolvers**（必要時）／エラーメッセージは i18n 集約可 |
| 提交    | 送信中は button `disabled` + スピナー、成功/失敗はトースト              |
| 初期値   | 詳細取得後に **`reset()`** 同期（ちらつき防止）                       |

---

## 6) 認証・保護（next-auth 前提）

| 項目       | ルール                                                                      |
| -------- | ------------------------------------------------------------------------ |
| サーバ保護    | RSC/Route Handler/Middleware は **`getServerSession`** でガード               |
| クライアント保護 | 画面は **`useSession({ required:true })`** またはガード HOC                       |
| Cookie   | `Domain=.example.com; HttpOnly; Secure; SameSite=None; Path=/`（BE へ自動送信） |
| 権限       | 画面表示制御 + ルートガードの **二重防御**（例: `system_admin`）                             |

---

## 7) OpenAPI Generator（TypeScript）運用

| 項目   | ルール                                                                                  |
| ---- | ------------------------------------------------------------------------------------ |
| 生成物  | `src/lib/api/` に格納（**直編集禁止**）                                                        |
| 実行   | `npm run openapi:gen`（CI で差分検出）                                                      |
| ラッパ  | `lib/api-client.ts` に fetch 設定（`Accept`, `Content-Type`, `credentials:"include"` ほか） |
| 責務分担 | エンドポイント組み合わせ/エラー整形は **features の hooks** に閉じ込める                                      |

---

## 8) フェッチ/CORS/Cookie（FE 側の約束）

| 項目    | ルール                                                                                       |
| ----- | ----------------------------------------------------------------------------------------- |
| リクエスト | 相対URL or `NEXT_PUBLIC_API_BASE_URL` を使用。**常に `credentials:"include"`**                    |
| CORS  | `https://*.app.example.com` / `https://admin.example.com`（BEと一致）                          |
| CSRF  | **Double-Submit Cookie**（`X-CSRF-Token` と同値 Cookie 照合）＋ 変更系は `application/json`（プリフライト強制） |

---

## 9) 品質/テスト（最小）

| 項目          | ルール                                   |
| ----------- | ------------------------------------- |
| Lint/Format | ESLint + Prettier（CI必須）               |
| TS          | **strict**                            |
| E2E         | 必要時 **Playwright**（ログインヘルパ用意）         |
| Visual回帰    | Storybook/Chromatic（任意、スナップショット乱発しない） |

---

## 10) 単一ファイル前提の明確化（バックエンド準拠）

バックエンド同様、「どこを単一」「どこを分割」かを**明文化**します。

| 対象                                                  | 分離ポリシー               | 目的                       |
| --------------------------------------------------- | -------------------- | ------------------------ |
| ルート配線（`app/layout.tsx`, `error.tsx`, `loading.tsx`） | **【\[ONE]】**         | 起動・横断関心を集中し再現性を担保        |
| ルートごとの `app/<feature>/**/page.tsx`                  | **【\[PER-PAGE]】**    | 画面単位の責務分離（薄い）            |
| 画面本体（`features/<feature>/components/<page>/*`）      | **【\[PER-PAGE]】**    | `list/show/edit` 等で明確に分割 |
| 機能横断ユーティリティ（`lib/*`）                                | **【\[ONE]/\[MANY]】** | 設定は単一、UI拡張は増殖可           |
| OpenAPI 生成物（`lib/api/*`）                            | **【\[MANY]】**        | 自動生成のため増加                |
| 機能別 Hooks/Types/Utils（`features/<feature>/*`）       | **【\[PER-FEATURE]】** | 機能境界で責務を閉じる              |

> **単一ファイルを想定するのは設定・配線・薄いルートのみ。** 画面・機能はページ/機能単位で**積極的に分割**します。

---

## 11) 具体例（`projects` 機能）

* `app/projects/page.tsx` … **薄い**器：`features/projects/components/list/ListPage` を呼ぶだけ
* `features/projects/components/list/ListPage.tsx` … 画面の起点。`Table`/`Filters` を組み立て
* `features/projects/hooks/useProjects.ts` … 一覧取得（SWR）
* `features/projects/hooks/useMutateProject.ts` … 作成/更新/削除（SWR mutate）
* `features/projects/utils/mapping.ts` … UI↔API の型・値変換

---

## 12) `frontend_user` と `frontend_admin` の住み分け

* ルート名のみ変わり、構造は**同一**。
* 管理系は `app/(admin)/...` セグメント採用可。
* 権限：**サーバ側 guard（getServerSession）＋ クライアント guard** の二重化で分離。
* API も同一クライアントを使用し、**管理系エンドポイント**（例: `/v1/admin/*`）は hooks 側で呼び分け。

---

了解。**「分離・凝集・疎結合」**と**「サイズ（行数/複雑度）**」のルールを追記します。既存番号を崩さないため、**13) と 14)** として追加します（そのまま末尾に継ぎ足してください）。

---

## 13) ソースコードの**分離・凝集・疎結合**（設計規約）

### 13.1 レイヤ境界と依存方向

* **依存方向（内向きのみ）**
  `app/* (薄い器) → features/* (画面/UI/ロジック) → lib/* (共通基盤)`／`shared/* (純UI/定数/i18n)`

  * **禁止**: `features/<A>` → `features/<B>`（機能横断の直接 import を禁止）
  * **許可**: `features/*` から `shared/*`・`lib/*` への import、かつ **自身の `<feature>` 配下**のみ
  * **API 呼び出し**は **features の hooks** から行う（**画面コンポーネント直呼び出し禁止**）

### 13.2 モジュールの**凝集**

* **高凝集**: 1ファイル＝1責務

  * 画面（Page）ファイルは「UIの組立とハンドラ定義」に限定。**データ取得・変換は hooks/utils に退避**
  * `utils/` は **UI↔API 変換/フォーマット**のみに限定（ビジネスロジックの肥大化禁止）
* **再利用単位**

  * 入力フィールドは `components/<page>/fields/*`、複数ページで使うなら **`features/<feature>/components/parts/*`** に抽出
  * 完全共通 UI（トースト・ダイアログ等）は **`shared/components/*`** に置く

### 13.3 疎結合（インタフェース/契約）

* **型の契約**: OpenAPI 生成型を **再エクスポート**して利用。補助型は `features/<feature>/types/*` に閉じる
* **関数の契約**: hooks は **入力=パラメタ/出力=型付けされた結果** を返し、副作用は内部に隠蔽
* **イベント/副作用**:

  * 副作用は **React hooks（`useEffect`/SWR）に限定**。**モジュールスコープの副作用禁止**
  * グローバルな状態共有が必要な場合も、まず **SWR + URL クエリ**で解決する（外部ステート管理の導入回避）

### 13.4 import ルール（境界の型守）

* **相対 import の深掘り禁止**（`../../..` が3階層を超える場合は構造見直し）
* **Barrel（index.ts）の氾濫防止**: `features/<feature>/index.ts` は **公開面**のみ、内部実装（`components/*` 直下）を無差別に再輸出しない
* **循環依存禁止**（ESLint で検知）。検出時は **関心分離** or **中間インタフェース**を導入

### 13.5 コンポーネント設計

* **コンポジション優先**（継承/巨大 props よりも、小さな部品の組み合わせ）
* **props の上限**: 原則 **8 プロパティ**まで。超える場合は **オブジェクト引数**にまとめる
* **子の責務**: 子コンポーネントは **表示責務**中心。\*\*データ取得は親（Page or 容器）\*\*に寄せる

---

## 14) **サイズ規約（行数 / 関数長 / 複雑度）**（ESLintで強制）

### 14.1 行数とエクスポート数

* **ファイル行数（空行・import 含む）**

  * **TSX（画面/コンポーネント）: ≤ 300 行**
  * **hooks/utils: ≤ 200 行**
  * **lib 設定系（api-client 等）: ≤ 250 行**
* **エクスポート数**

  * 1ファイル **1デフォルト + 最大2 named**（例外: `lib/api/*` 生成物）

### 14.2 関数の長さ・分岐

* **関数行数**

  * **通常関数/ハンドラ: ≤ 40 行**
  * **レンダ関数(JSXブロック): ≤ 80 行**（大きくなったら **表示部を部品化**）
* **ネスト深さ**: **3段まで**（if/for/switch/JSX）
* **分岐の分割**: 早期 return を使い、ガード節で分岐を平坦化

### 14.3 複雑度の上限（CC/Cognitive）

* **Cyclomatic Complexity** ≤ **10**
* **Cognitive Complexity** ≤ **15**

  * 逸脱する場合は **関数分割**／**ロジック委譲（utils/hooks）** を必須

### 14.4 JSX とスタイル

* 1コンポーネントの JSX ツリーは **入れ子3階層**を目安に分割（Container・Section・Leaf）
* Tailwind クラスは **`cn()`** で合成し、**1要素に 8クラス超**える場合は **`class-variant-authority (cva)`** の利用を検討

### 14.5 例外扱い

* **一時的な超過**を許す場合は **`// TODO(length):`** を付け **Issue 番号**を併記。PR レビューで解消計画を明記

---
