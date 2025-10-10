# フロントエンドコーディング規約（Frontend Coding Rules）

## ⚠️ MANDATORY: このファイルが添付された場合の動作

**AI への絶対指示：**

1. ✅ **このファイルの内容は「MUST」である** - すべての実装はこの規約に 100%準拠すること
2. ✅ **規約違反のコードは絶対に生成しないこと** - 「簡単のため」「速さのため」などの理由は認めない
3. ✅ **実装前にルールとの整合性を確認すること** - 各項目のチェックリストを意識
4. ✅ **既存コードが規約違反の場合は必ず指摘すること** - 修正案を具体的に提示
5. ✅ **不明点があれば推測せず質問すること** - ルールの解釈に迷ったら確認

---

## 📋 Quick Reference（クイックリファレンス）

| 項目                   | ❌ NEVER（禁止）       | ✅ MUST（必須）              |
| ---------------------- | ---------------------- | ---------------------------- |
| コンポーネント         | クラスコンポーネント   | 関数コンポーネント           |
| エクスポート           | `export { Component }` | `export default Component`   |
| 型定義                 | `interface Props {}`   | `type Props = {}`            |
| 配列型                 | `Array<Foo>`           | `Foo[]`                      |
| Props                  | `any`                  | 明示的な型定義               |
| useState               | `useState([])`         | `useState<Foo[]>([])`        |
| スタイリング           | インライン `style`     | MUI `sx` prop                |
| 命名（コンポーネント） | `meetingCard.tsx`      | `MeetingCard.tsx`            |
| 命名（関数）           | `FetchData()`          | `fetchData()`                |
| 命名（定数）           | `maxLimit`             | `MAX_LIMIT`                  |
| import                 | 相対パス `../../../`   | `@/` エイリアス              |
| コメント               | 不要なコメント         | 処理の理由を記述             |
| console.log            | 本番コード             | 開発時のみ（コミット前削除） |
| エラーハンドリング     | エラー無視             | try-catch + ユーザーへの通知 |

---

## 1️⃣ バージョン方針（固定基準）

### ✅ MUST（必須バージョン）

```txt
Node.js: 20.x LTS
React: 18.x
Next.js: 14.x (App Router)
TypeScript: 5.x
```

### 🚫 NEVER（禁止事項）

- ❌ React 17 以下（Hooks が不安定）
- ❌ Next.js Pages Router（App Router を使用）
- ❌ JavaScript（TypeScript 必須）

### 📦 package.json 例

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "@mui/material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@nextui-org/react": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "eslint-config-airbnb": "^19.0.4",
    "prettier": "^3.1.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0"
  }
}
```

---

## 2️⃣ プロジェクト構成・共通ツール

### ✅ MUST（必須構成）

```
frontend/
├── src/
│   ├── app/                     # App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # トップページ
│   │   ├── globals.css         # グローバルスタイル
│   │   ├── meetings/
│   │   │   ├── page.tsx        # 一覧ページ
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # 詳細ページ
│   │   │   └── new/
│   │   │       └── page.tsx    # 作成ページ
│   │   └── history/
│   │       └── page.tsx
│   ├── components/              # 共通コンポーネント
│   │   ├── pages/              # ページレベルコンポーネント
│   │   │   ├── MeetingListPage/
│   │   │   │   ├── index.tsx
│   │   │   │   └── MeetingListPage.tsx
│   │   │   └── MeetingDetailPage/
│   │   │       └── index.tsx
│   │   ├── sections/           # セクションレベルコンポーネント
│   │   │   ├── MeetingCard/
│   │   │   │   ├── index.tsx
│   │   │   │   └── MeetingCard.tsx
│   │   │   └── AgendaList/
│   │   │       └── index.tsx
│   │   └── ui/                 # UI部品（Button, Input等）
│   │       ├── Button/
│   │       └── Input/
│   ├── lib/                     # ユーティリティ
│   │   ├── api.ts              # API クライアント
│   │   ├── constants.ts        # 定数
│   │   ├── utils.ts            # 汎用関数
│   │   └── types.ts            # 共通型定義
│   ├── hooks/                   # カスタムフック
│   │   ├── useMeetings.ts
│   │   └── useAuth.ts
│   └── styles/                  # スタイル関連
│       └── theme.ts            # MUI テーマ
├── public/                      # 静的ファイル
├── .eslintrc.json              # ESLint 設定
├── .prettierrc                 # Prettier 設定
├── tsconfig.json               # TypeScript 設定
├── next.config.mjs             # Next.js 設定
└── package.json
```

### 📦 ESLint + Prettier 設定

#### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "airbnb",
    "airbnb-typescript",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": "arrow-function",
        "unnamedComponents": "arrow-function"
      }
    ],
    "import/prefer-default-export": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

#### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

---

## 3️⃣ コンポーネント設計

### ✅ MUST（関数コンポーネント）

```tsx
// ✅ Good: 関数コンポーネント + default export
import { FC } from "react";

type MeetingCardProps = {
  id: string;
  title: string;
  date: string;
  onSelect: (id: string) => void;
};

/**
 * 会議カードコンポーネント
 *
 * 会議の基本情報を表示し、クリックで詳細ページへ遷移する
 *
 * @param props - コンポーネントのプロパティ
 * @returns 会議カードの JSX 要素
 */
const MeetingCard: FC<MeetingCardProps> = ({ id, title, date, onSelect }) => {
  const handleClick = () => {
    onSelect(id);
  };

  return (
    <div onClick={handleClick}>
      <h3>{title}</h3>
      <p>{date}</p>
    </div>
  );
};

export default MeetingCard;
```

### 🚫 NEVER（クラスコンポーネント）

```tsx
// ❌ Bad: クラスコンポーネント（禁止）
class MeetingCard extends React.Component<MeetingCardProps> {
  render() {
    return <div>...</div>;
  }
}
```

### ✅ MUST（JSDoc コメント）

```tsx
/**
 * ページレベルコンポーネント: 会議一覧画面
 *
 * 作成済みの会議一覧を表示し、新規作成・詳細表示への導線を提供する
 */
const MeetingListPage: FC = () => {
  // ...
};
```

---

## 4️⃣ TypeScript 使用規約

### ✅ MUST（type 使用）

```tsx
// ✅ Good: type を使用
type User = {
  id: string;
  name: string;
  email: string;
};

type MeetingStatus = "draft" | "active" | "completed";

type ApiResponse<T> = {
  data: T;
  error: string | null;
};
```

### 🚫 NEVER（interface 使用）

```tsx
// ❌ Bad: interface は使わない
interface User {
  id: string;
  name: string;
}
```

### ✅ MUST（配列型は Foo[]）

```tsx
// ✅ Good
const users: User[] = [];
const ids: string[] = [];

// ❌ Bad
const users: Array<User> = [];
```

### ✅ MUST（ジェネリクスの明示）

```tsx
// ✅ Good: useState に型を明示
const [meetings, setMeetings] = useState<Meeting[]>([]);
const [user, setUser] = useState<User | null>(null);

// ❌ Bad: 型推論に任せる（危険）
const [meetings, setMeetings] = useState([]);
```

### 🚫 NEVER（any 禁止）

```tsx
// ❌ Bad: any は禁止
const handleData = (data: any) => {
  // ...
};

// ✅ Good: 具体的な型を定義
type ApiData = {
  meetings: Meeting[];
  count: number;
};

const handleData = (data: ApiData) => {
  // ...
};

// ✅ Good: unknown を使い、型ガード
const handleData = (data: unknown) => {
  if (typeof data === "object" && data !== null && "meetings" in data) {
    // 型安全
  }
};
```

---

## 5️⃣ 命名規則

### ✅ MUST（命名ルール）

```tsx
// ✅ コンポーネント・型: UpperCamelCase
type MeetingCardProps = { ... };
const MeetingCard: FC<MeetingCardProps> = () => { ... };

// ✅ 関数・変数: lowerCamelCase
const fetchMeetingData = async () => { ... };
const meetingList = [...];
const isLoading = false;

// ✅ 定数: UPPER_SNAKE_CASE
const API_BASE_URL = "http://localhost:8000";
const MAX_MEETING_DURATION = 180;
const DEFAULT_PAGE_SIZE = 20;

// ✅ プライベート関数: 先頭アンダースコア
const _validateInput = (value: string) => { ... };

// ✅ カスタムフック: use から始まる
const useMeetings = () => { ... };
const useAuth = () => { ... };
```

### 🚫 NEVER（命名 NG）

```tsx
// ❌ Bad: コンポーネントが小文字
const meetingCard = () => { ... };

// ❌ Bad: 関数が大文字始まり
const FetchData = () => { ... };

// ❌ Bad: 定数が小文字
const apiBaseUrl = "...";

// ❌ Bad: 単数・複数の混乱
const meeting = [...]  // 配列なのに単数形
const meetings = getMeeting()  // 単数取得なのに複数形
```

### ✅ MUST（ファイル名）

```
// ✅ コンポーネント: UpperCamelCase
MeetingCard.tsx
MeetingListPage.tsx
AgendaSection.tsx

// ✅ ユーティリティ: lowerCamelCase
api.ts
utils.ts
constants.ts

// ✅ フック: use から始まる
useMeetings.ts
useAuth.ts

// ✅ 型定義: types.ts または対象名.types.ts
types.ts
meeting.types.ts
```

---

## 6️⃣ スタイリング規約

### ✅ MUST（MUI sx prop 優先）

```tsx
import { Box, Button } from "@mui/material";

const MeetingCard: FC<Props> = ({ title }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 1,
        backgroundColor: "background.paper",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <Button
        sx={{
          marginTop: 2,
          fontWeight: "bold",
        }}
      >
        {title}
      </Button>
    </Box>
  );
};
```

### ✅ MUST（@emotion/styled: sx で不十分な場合のみ）

```tsx
import styled from "@emotion/styled";

// ✅ Good: 複雑なスタイルや再利用性が高い場合
const StyledCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const MeetingCard: FC = () => {
  return <StyledCard>...</StyledCard>;
};
```

### 🚫 NEVER（インライン style）

```tsx
// ❌ Bad: インライン style は禁止
<div style={{ padding: "16px", color: "red" }}>...</div>

// ✅ Good: sx prop を使用
<Box sx={{ padding: 2, color: "error.main" }}>...</Box>
```

---

## 7️⃣ 状態管理・副作用

### ✅ MUST（useState の型明示）

```tsx
import { useState, useEffect } from "react";

const MeetingListPage: FC = () => {
  // ✅ Good: 型を明示
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/meetings");
        const data: Meeting[] = await response.json();
        setMeetings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // 依存配列を必ず記載

  return <div>...</div>;
};
```

### 🚫 NEVER（useEffect の依存配列省略）

```tsx
// ❌ Bad: 依存配列がない（無限ループの危険）
useEffect(() => {
  fetchData();
});

// ❌ Bad: 依存を無視
useEffect(() => {
  console.log(meetings);
}, []); // meetings が依存に含まれていない

// ✅ Good: 依存配列を正しく指定
useEffect(() => {
  console.log(meetings);
}, [meetings]);
```

### ✅ MUST（カスタムフック化）

```tsx
// hooks/useMeetings.ts
import { useState, useEffect } from "react";

type UseMeetingsReturn = {
  meetings: Meeting[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export const useMeetings = (): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data: Meeting[] = await response.json();
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return { meetings, isLoading, error, refetch: fetchMeetings };
};

// 使用側
const MeetingListPage: FC = () => {
  const { meetings, isLoading, error, refetch } = useMeetings();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* meetings を表示 */}</div>;
};
```

---

## 8️⃣ API 通信・エラーハンドリング

### ✅ MUST（API クライアント集約）

```tsx
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiError = {
  message: string;
  status: number;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async getMeetings(): Promise<Meeting[]> {
    return this.request<Meeting[]>("/meetings");
  }

  async getMeeting(id: string): Promise<Meeting> {
    return this.request<Meeting>(`/meetings/${id}`);
  }

  async createMeeting(data: MeetingCreate): Promise<Meeting> {
    return this.request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### ✅ MUST（エラーハンドリング）

```tsx
import { useState } from "react";
import { apiClient } from "@/lib/api";

const CreateMeetingPage: FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: MeetingCreate) => {
    setError(null);
    try {
      await apiClient.createMeeting(data);
      // 成功時の処理
      router.push("/meetings");
    } catch (err) {
      // エラーをユーザーに通知
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("予期しないエラーが発生しました");
      }
      console.error("Failed to create meeting:", err);
    }
  };

  return (
    <div>
      {error && <div style={{ color: "red" }}>エラー: {error}</div>}
      {/* フォーム */}
    </div>
  );
};
```

---

## 9️⃣ コメント規約

### ✅ MUST（適切なコメント）

```tsx
/**
 * 会議一覧ページ
 *
 * 作成済みの会議を一覧表示し、新規作成・詳細表示への導線を提供する
 */
const MeetingListPage: FC = () => {
  // リアルタイム更新のため、5秒ごとにポーリング
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  // 議題から逸脱している会議を強調表示
  // しきい値0.3は過去の運用データから決定
  const highlightedMeetings = meetings.filter((m) => m.deviationScore < 0.3);

  return <div>...</div>;
};
```

### 🚫 NEVER（不要なコメント）

```tsx
// ❌ Bad: 自明なコメント
// ユーザーIDを設定
setUserId(id);

// ❌ Bad: コメントアウトされた古いコード
// const oldFunction = () => { ... };

// ❌ Bad: コードと矛盾するコメント
// 会議を削除する
const createMeeting = () => { ... };
```

---

## 🔟 パフォーマンス最適化

### ✅ MUST（メモ化）

```tsx
import { useMemo, useCallback } from "react";

const MeetingListPage: FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filter, setFilter] = useState<string>("");

  // ✅ Good: 重い計算はメモ化
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) =>
      m.title.toLowerCase().includes(filter.toLowerCase())
    );
  }, [meetings, filter]);

  // ✅ Good: コールバックはメモ化
  const handleSelect = useCallback((id: string) => {
    router.push(`/meetings/${id}`);
  }, []);

  return (
    <div>
      {filteredMeetings.map((meeting) => (
        <MeetingCard key={meeting.id} {...meeting} onSelect={handleSelect} />
      ))}
    </div>
  );
};
```

### 🚫 NEVER（過度な最適化）

```tsx
// ❌ Bad: 単純な計算までメモ化（オーバーヘッド）
const sum = useMemo(() => a + b, [a, b]);

// ✅ Good: 単純な計算はそのまま
const sum = a + b;
```

---

## 1️⃣1️⃣ Next.js App Router 規約

### ✅ MUST（Server Component 活用）

```tsx
// app/meetings/page.tsx
// デフォルトで Server Component
import { apiClient } from "@/lib/api";

// サーバー側でデータ取得
const MeetingsPage = async () => {
  const meetings = await apiClient.getMeetings();

  return (
    <div>
      <h1>会議一覧</h1>
      {meetings.map((meeting) => (
        <div key={meeting.id}>{meeting.title}</div>
      ))}
    </div>
  );
};

export default MeetingsPage;
```

### ✅ MUST（Client Component: "use client" 明示）

```tsx
// components/MeetingCard/MeetingCard.tsx
"use client";

import { useState } from "react";

const MeetingCard: FC<Props> = ({ id, title }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title}
    </div>
  );
};

export default MeetingCard;
```

### ✅ MUST（動的ルート）

```tsx
// app/meetings/[id]/page.tsx
type PageProps = {
  params: { id: string };
};

const MeetingDetailPage = async ({ params }: PageProps) => {
  const { id } = params;
  const meeting = await apiClient.getMeeting(id);

  return (
    <div>
      <h1>{meeting.title}</h1>
      {/* 詳細表示 */}
    </div>
  );
};

export default MeetingDetailPage;
```

---

## 1️⃣2️⃣ import/export 規約

### ✅ MUST（絶対パス import）

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// ✅ Good: 絶対パス
import { MeetingCard } from "@/components/sections/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import { API_BASE_URL } from "@/lib/constants";

// ❌ Bad: 相対パス（深いネストは避ける）
import { MeetingCard } from "../../../components/sections/MeetingCard";
```

### ✅ MUST（default export）

```tsx
// ✅ Good: コンポーネントは default export
const MeetingCard: FC<Props> = () => { ... };
export default MeetingCard;

// ❌ Bad: 名前付き export（コンポーネント）
export const MeetingCard: FC<Props> = () => { ... };
```

### ✅ MUST（ユーティリティは名前付き export）

```tsx
// lib/utils.ts
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const truncate = (text: string, length: number): string => {
  return text.length > length ? `${text.slice(0, length)}...` : text;
};
```

---

## 1️⃣3️⃣ デバッグ・ログ

### 🚫 NEVER（console.log を本番に残す）

```tsx
// ❌ Bad: console.log を本番コードに残す
const handleSubmit = () => {
  console.log("Form submitted"); // コミット前に削除
  submitForm();
};

// ✅ Good: 開発時のみ
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}

// ✅ Good: エラーは console.error（許可）
try {
  await submitForm();
} catch (error) {
  console.error("Form submission failed:", error);
}
```

---

## 📋 実装チェックリスト

コード生成後、以下を必ず確認すること：

### 基本

- [ ] 関数コンポーネント使用
- [ ] default export（コンポーネント）
- [ ] `type` 使用（`interface` 禁止）
- [ ] 配列型は `Foo[]` 形式
- [ ] `any` 禁止

### 命名

- [ ] コンポーネント・型: `UpperCamelCase`
- [ ] 関数・変数: `lowerCamelCase`
- [ ] 定数: `UPPER_SNAKE_CASE`
- [ ] カスタムフック: `use` から始まる
- [ ] ファイル名がルールに準拠

### スタイリング

- [ ] MUI `sx` prop 優先
- [ ] インライン `style` 禁止
- [ ] `@emotion/styled` は複雑な場合のみ

### 状態管理

- [ ] `useState` に型明示
- [ ] `useEffect` の依存配列を正しく指定
- [ ] カスタムフック化（複雑なロジック）

### API・エラーハンドリング

- [ ] API クライアント集約（`lib/api.ts`）
- [ ] try-catch でエラーハンドリング
- [ ] ユーザーへのエラー通知

### コメント・ログ

- [ ] JSDoc コメント（ページ・セクションコンポーネント）
- [ ] 処理の理由を記載
- [ ] `console.log` 削除（コミット前）
- [ ] `console.error` は許可（エラー時）

### Next.js

- [ ] Server Component を優先
- [ ] Client Component は `"use client"` 明示
- [ ] 絶対パス import（`@/` エイリアス）

### ツール設定

- [ ] ESLint 設定（Airbnb）
- [ ] Prettier 設定
- [ ] コミット前に `npm run lint` 実行

---

## 📖 最小構成サンプル（完全版）

```tsx
// components/sections/MeetingCard/MeetingCard.tsx
"use client";

import { FC } from "react";
import { Box, Typography, Button } from "@mui/material";

type MeetingCardProps = {
  id: string;
  title: string;
  date: string;
  participantsCount: number;
  onSelect: (id: string) => void;
};

/**
 * 会議カードコンポーネント
 *
 * 会議の基本情報を表示し、クリックで詳細ページへ遷移する
 *
 * @param props - コンポーネントのプロパティ
 * @returns 会議カードの JSX 要素
 */
const MeetingCard: FC<MeetingCardProps> = ({
  id,
  title,
  date,
  participantsCount,
  onSelect,
}) => {
  const handleClick = () => {
    onSelect(id);
  };

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: 1,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-2px)",
        },
      }}
      onClick={handleClick}
    >
      <Typography variant="h6" component="h3">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {date}
      </Typography>
      <Typography variant="caption">参加者: {participantsCount}名</Typography>
      <Button variant="outlined" size="small" sx={{ marginTop: 1 }}>
        詳細を見る
      </Button>
    </Box>
  );
};

export default MeetingCard;
```

```tsx
// hooks/useMeetings.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Meeting } from "@/lib/types";

type UseMeetingsReturn = {
  meetings: Meeting[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * 会議一覧を取得するカスタムフック
 *
 * @returns 会議一覧、ローディング状態、エラー、再取得関数
 */
export const useMeetings = (): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getMeetings();
      setMeetings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch meetings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    isLoading,
    error,
    refetch: fetchMeetings,
  };
};
```

```tsx
// app/meetings/page.tsx
"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, CircularProgress, Alert } from "@mui/material";
import MeetingCard from "@/components/sections/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";

/**
 * ページレベルコンポーネント: 会議一覧画面
 *
 * 作成済みの会議一覧を表示し、新規作成・詳細表示への導線を提供する
 */
const MeetingsPage: FC = () => {
  const router = useRouter();
  const { meetings, isLoading, error } = useMeetings();

  const handleSelectMeeting = (id: string) => {
    router.push(`/meetings/${id}`);
  };

  if (isLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">エラー: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" sx={{ marginBottom: 3 }}>
        会議一覧
      </Typography>
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          id={meeting.id}
          title={meeting.title}
          date={meeting.created_at}
          participantsCount={meeting.participants.length}
          onSelect={handleSelectMeeting}
        />
      ))}
    </Container>
  );
};

export default MeetingsPage;
```

---

## 🎯 まとめ

このファイルが添付された場合、AI は以下を厳守すること：

1. ✅ **すべての実装はこの規約に 100%準拠**

   - TypeScript 必須、型安全を徹底
   - 関数コンポーネント、`type` 使用、配列型 `Foo[]`

2. ✅ **チェックリストを意識して実装**

   - 命名規則、スタイリング、状態管理、エラーハンドリングを確認
   - ESLint/Prettier による自動チェックを前提

3. ✅ **規約違反を発見したら必ず指摘**

   - 既存コードの問題点も指摘し、修正案を提示
   - `any`, `interface`, インライン `style` 等の典型的違反を見逃さない

4. ✅ **不明点は推測せず質問**

   - ルール解釈に迷ったら確認
   - デザイン要件が不明確な場合も質問

5. ✅ **コード例を参考に実装**
   - Quick Reference と各セクションのサンプルコードを活用
   - 最小構成サンプル（完全版）を参考に一貫性を保つ

---

**規約を守ることで、以下を実現できます：**

- 🛡️ **保守性**: 一貫したコードスタイルで可読性向上
- 🔒 **型安全**: TypeScript による堅牢な実装
- ⚡ **効率性**: ESLint/Prettier による高速レビュー
- 🎨 **UI/UX**: MUI/Emotion によるモダンなデザイン
- 🚀 **パフォーマンス**: Next.js 14 App Router + Server Component の最大活用
