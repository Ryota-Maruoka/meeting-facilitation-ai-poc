---
title: "会議管理API - API契約書"
status: "active"
owner: "api-team"
last_update: "2025-02-11"
confidentiality: "internal"
related:
  - "../spec.md"
  - "../design.md"
  - "../../../apps/backend/overview.md"
---

# 会議管理API - API契約書

## 1. 概要

会議管理機能のRESTful API仕様を定義します。
バックエンド（FastAPI）の実装に基づいたAPI契約です。

**ベースURL**:
- 開発環境: `http://localhost:8000`
- 本番環境: `https://api.example.com`

**認証**: なし（PoC段階）

**共通ヘッダー**:
```
Content-Type: application/json
Accept: application/json
```

---

## 2. エンドポイント一覧

| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| `/meetings` | GET | 会議一覧取得 |
| `/meetings` | POST | 会議作成 |
| `/meetings/{id}` | GET | 会議詳細取得 |
| `/meetings/{id}` | PUT | 会議更新 |
| `/meetings/{id}` | DELETE | 会議削除 |
| `/meetings/{id}/start` | POST | 会議開始 |
| `/meetings/{id}/end` | POST | 会議終了 |

---

## 3. API詳細仕様

### 3.1 会議一覧取得

**エンドポイント**: `GET /meetings`

**説明**: 全会議を取得します（最新順）

**リクエスト**:
- クエリパラメータ: なし

**レスポンス**: `200 OK`

```json
[
  {
    "id": "uuid-string",
    "createdAt": "2025-02-11T10:00:00Z",
    "updatedAt": "2025-02-11T10:30:00Z",
    "startedAt": "2025-02-11T10:05:00Z",
    "endedAt": null,
    "title": "週次ミーティング",
    "purpose": "進捗確認",
    "deliverable_template": "次週のアクション決定",
    "meetingDate": "2025-02-11",
    "participants": ["太郎", "花子"],
    "agenda": [
      {
        "title": "進捗報告",
        "duration": 15,
        "expectedOutcome": "各自の進捗を共有",
        "relatedUrl": null
      }
    ],
    "status": "in_progress"
  }
]
```

**エラー**:
- `500 Internal Server Error`: サーバーエラー（空配列を返す）

**実装ファイル**: `backend/app/routers/meetings.py::list_meetings`

---

### 3.2 会議作成

**エンドポイント**: `POST /meetings`

**説明**: 新規会議を作成します

**リクエストボディ**:

```json
{
  "id": "uuid-string",  // 任意（未指定時は自動生成）
  "title": "週次ミーティング",
  "purpose": "進捗確認",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",  // 任意（YYYY-MM-DD形式）
  "participants": ["太郎", "花子"],  // 任意
  "agenda": [  // 任意
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    }
  ]
}
```

**バリデーション**:
- `title`: 必須、1-200文字
- `purpose`: 必須、1文字以上
- `deliverable_template`: 必須、1文字以上
- `meetingDate`: 任意、YYYY-MM-DD形式
- `participants`: 任意、文字列配列
- `agenda`: 任意、AgendaItem配列
  - `title`: 必須、1-200文字
  - `duration`: 必須、1-480（分）
  - `expectedOutcome`: 任意
  - `relatedUrl`: 任意

**レスポンス**: `201 Created`

```json
{
  "id": "uuid-string",
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T10:00:00Z",
  "startedAt": null,
  "endedAt": null,
  "title": "週次ミーティング",
  "purpose": "進捗確認",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    }
  ],
  "status": "draft"
}
```

**エラー**:
- `400 Bad Request`: バリデーションエラー
- `500 Internal Server Error`: サーバーエラー

**実装ファイル**: `backend/app/routers/meetings.py::create_meeting`

**備考**:
- 会議作成時に以下のファイルが自動生成されます
  - `data/meetings/{meeting_id}/meeting.json`
  - `data/meetings/{meeting_id}/transcripts.json`（空配列）
  - `data/meetings/{meeting_id}/summary.json`（初期値）

---

### 3.3 会議詳細取得

**エンドポイント**: `GET /meetings/{id}`

**説明**: 特定会議の詳細情報を取得します

**パスパラメータ**:
- `id`: 会議ID（UUID）

**レスポンス**: `200 OK`

```json
{
  "id": "uuid-string",
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T10:30:00Z",
  "startedAt": "2025-02-11T10:05:00Z",
  "endedAt": null,
  "title": "週次ミーティング",
  "purpose": "進捗確認",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    }
  ],
  "status": "in_progress"
}
```

**エラー**:
- `404 Not Found`: 会議が見つからない

**実装ファイル**: `backend/app/routers/meetings.py::get_meeting`

---

### 3.4 会議更新

**エンドポイント**: `PUT /meetings/{id}`

**説明**: 会議情報を更新します

**パスパラメータ**:
- `id`: 会議ID（UUID）

**リクエストボディ**:

```json
{
  "title": "週次ミーティング（更新）",
  "purpose": "進捗確認と課題共有",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子", "次郎"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    },
    {
      "title": "課題共有",
      "duration": 10,
      "expectedOutcome": "課題の洗い出し",
      "relatedUrl": null
    }
  ],
  "status": "draft",
  "started_at": "2025-02-11T10:05:00Z",
  "ended_at": null,
  "summary": null
}
```

**更新可能フィールド**:
- `title`
- `purpose`
- `deliverable_template`
- `meetingDate`
- `participants`
- `agenda`
- `status`
- `started_at`
- `ended_at`
- `summary`

**レスポンス**: `200 OK`

```json
{
  "id": "uuid-string",
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T10:35:00Z",
  "startedAt": "2025-02-11T10:05:00Z",
  "endedAt": null,
  "title": "週次ミーティング（更新）",
  "purpose": "進捗確認と課題共有",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子", "次郎"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    },
    {
      "title": "課題共有",
      "duration": 10,
      "expectedOutcome": "課題の洗い出し",
      "relatedUrl": null
    }
  ],
  "status": "draft"
}
```

**エラー**:
- `404 Not Found`: 会議が見つからない
- `400 Bad Request`: バリデーションエラー

**実装ファイル**: `backend/app/routers/meetings.py::update_meeting`

**備考**:
- `updated_at`は自動更新されます

---

### 3.5 会議削除

**エンドポイント**: `DELETE /meetings/{id}`

**説明**: 会議と関連データを削除します

**パスパラメータ**:
- `id`: 会議ID（UUID）

**レスポンス**: `204 No Content`

レスポンスボディなし

**エラー**:
- `404 Not Found`: 会議が見つからない
- `500 Internal Server Error`: 削除失敗

**実装ファイル**: `backend/app/routers/meetings.py::delete_meeting`

**備考**:
- 以下のデータがすべて削除されます
  - `data/meetings/{meeting_id}/meeting.json`
  - `data/meetings/{meeting_id}/transcripts.json`
  - `data/meetings/{meeting_id}/summary.json`

---

### 3.6 会議開始

**エンドポイント**: `POST /meetings/{id}/start`

**説明**: 会議を「進行中」状態にして開始時刻を記録します

**パスパラメータ**:
- `id`: 会議ID（UUID）

**リクエストボディ**: なし

**レスポンス**: `200 OK`

```json
{
  "id": "uuid-string",
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T10:05:00Z",
  "startedAt": "2025-02-11T10:05:00Z",
  "endedAt": null,
  "title": "週次ミーティング",
  "purpose": "進捗確認",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    }
  ],
  "status": "in_progress"
}
```

**エラー**:
- `404 Not Found`: 会議が見つからない

**実装ファイル**: `backend/app/routers/meetings.py::start_meeting`

**副作用**:
- `started_at`が現在時刻（UTC）に設定されます
- `status`が`"in_progress"`に変更されます
- `updated_at`が現在時刻（UTC）に更新されます
- 3分ごとのミニ要約生成スケジューラーが起動します

---

### 3.7 会議終了

**エンドポイント**: `POST /meetings/{id}/end`

**説明**: 会議を「完了」状態にして終了時刻を記録します

**パスパラメータ**:
- `id`: 会議ID（UUID）

**リクエストボディ**: なし

**レスポンス**: `200 OK`

```json
{
  "id": "uuid-string",
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T11:00:00Z",
  "startedAt": "2025-02-11T10:05:00Z",
  "endedAt": "2025-02-11T11:00:00Z",
  "title": "週次ミーティング",
  "purpose": "進捗確認",
  "deliverable_template": "次週のアクション決定",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子"],
  "agenda": [
    {
      "title": "進捗報告",
      "duration": 15,
      "expectedOutcome": "各自の進捗を共有",
      "relatedUrl": null
    }
  ],
  "status": "completed"
}
```

**エラー**:
- `404 Not Found`: 会議が見つからない

**実装ファイル**: `backend/app/routers/meetings.py::end_meeting`

**副作用**:
- `ended_at`が現在時刻（UTC）に設定されます
- `status`が`"completed"`に変更されます
- `updated_at`が現在時刻（UTC）に更新されます
- ミニ要約生成スケジューラーが停止します
- 最終要約生成タスクがバックグラウンドで起動します
  - 全文字起こしテキストから要約・決定事項・未決事項・アクション項目を抽出
  - `data/meetings/{meeting_id}/summary.json`に保存

---

## 4. 共通データモデル

### 4.1 Meeting（会議）

```typescript
{
  id: string,              // UUID
  createdAt: string,       // ISO 8601形式（UTC）
  updatedAt: string,       // ISO 8601形式（UTC）
  startedAt: string | null, // ISO 8601形式（UTC）
  endedAt: string | null,  // ISO 8601形式（UTC）
  title: string,           // 1-200文字
  purpose: string,         // 1文字以上
  deliverable_template: string, // 1文字以上
  meetingDate: string | null, // YYYY-MM-DD形式
  participants: string[],  // 参加者名リスト
  agenda: AgendaItem[],    // アジェンダ項目
  status: "draft" | "in_progress" | "completed"
}
```

### 4.2 AgendaItem（アジェンダ項目）

```typescript
{
  title: string,           // 1-200文字
  duration: number,        // 1-480（分）
  expectedOutcome: string | null,
  relatedUrl: string | null
}
```

---

## 5. エラーレスポンス

### 5.1 エラーフォーマット

```json
{
  "error": "ErrorClassName",
  "message": "エラーメッセージ",
  "path": "/meetings/invalid-id"
}
```

### 5.2 HTTPステータスコード

| コード | 説明 | 例 |
|-------|------|---|
| 200 | 成功 | GET, PUT リクエスト成功 |
| 201 | 作成成功 | POST /meetings 成功 |
| 204 | 削除成功 | DELETE /meetings/{id} 成功 |
| 400 | バリデーションエラー | 必須フィールド欠落 |
| 404 | リソース未検出 | 会議が見つからない |
| 500 | サーバーエラー | 予期しないエラー |

---

## 6. API使用例

### 6.1 会議作成→開始→終了のフロー

```bash
# 1. 会議作成
curl -X POST http://localhost:8000/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "週次ミーティング",
    "purpose": "進捗確認",
    "deliverable_template": "次週のアクション決定",
    "meetingDate": "2025-02-11",
    "participants": ["太郎", "花子"],
    "agenda": [
      {
        "title": "進捗報告",
        "duration": 15,
        "expectedOutcome": "各自の進捗を共有"
      }
    ]
  }'

# レスポンス: { "id": "abc-123", "status": "draft", ... }

# 2. 会議開始
curl -X POST http://localhost:8000/meetings/abc-123/start

# レスポンス: { "id": "abc-123", "status": "in_progress", "startedAt": "2025-02-11T10:05:00Z", ... }

# 3. 会議終了
curl -X POST http://localhost:8000/meetings/abc-123/end

# レスポンス: { "id": "abc-123", "status": "completed", "endedAt": "2025-02-11T11:00:00Z", ... }
```

### 6.2 会議一覧取得

```bash
curl http://localhost:8000/meetings
```

### 6.3 会議詳細取得

```bash
curl http://localhost:8000/meetings/abc-123
```

### 6.4 会議更新

```bash
curl -X PUT http://localhost:8000/meetings/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "週次ミーティング（更新）",
    "purpose": "進捗確認と課題共有"
  }'
```

### 6.5 会議削除

```bash
curl -X DELETE http://localhost:8000/meetings/abc-123
```

---

## 7. バージョニング

**現在のバージョン**: v1（暗黙）

**将来のバージョニング戦略**:
- URLパスにバージョンを含める（例: `/v1/meetings`, `/v2/meetings`）
- 破壊的変更時に新バージョンを提供
- 旧バージョンは一定期間サポート

---

## 8. レート制限

**現状**: なし（PoC段階）

**将来的な実装**:
- 1分あたり100リクエスト
- 超過時は`429 Too Many Requests`

---

## 9. CORS設定

**許可オリジン**:
- 開発環境: `http://localhost:3000`
- 本番環境: `https://bemac-meeting.fr-aicompass.com`

**許可メソッド**: すべて（`*`）

**許可ヘッダー**: すべて（`*`）

**クレデンシャル**: 許可（`allow_credentials=True`）

---

## 10. セキュリティ

### 10.1 現状（PoC段階）

- 認証なし（全ユーザーが全会議にアクセス可能）
- CORS制限のみ

### 10.2 将来的な実装

- JWT認証
- ロールベースアクセス制御（RBAC）
- 会議作成者・参加者のみアクセス可能
- リクエスト署名

---

## 関連ドキュメント

- [会議管理機能 - 要件定義書](../spec.md)
- [会議管理機能 - 処理設計書](../design.md)
- [バックエンド アーキテクチャ概要](../../../apps/backend/overview.md)
- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [OpenAPI仕様](http://localhost:8000/docs)（開発環境）
