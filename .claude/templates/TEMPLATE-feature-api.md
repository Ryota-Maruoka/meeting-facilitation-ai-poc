---
title: "<Feature>: API Contracts"
status: "wip"                        # wip | review | approved
owner: "@owner"
related: []                          # 対応する spec.md / design.md / ADR へのリンク
last_update: "YYYY-MM-DD"
confidentiality: "internal"
---

# 1. 概要

このファイルは `<Feature>` 機能における **REST / RPC / Event API 契約** を定義します。  
実装言語やフレームワーク（FastAPIなど）に依存せず、  
「外部公開インターフェースとしてどうあるべきか」を明文化します。

---

# 2. エンドポイント一覧

| Method | Path | 概要 | 認可 | ステータス |
|---------|------|------|------|-------------|
| GET | `/v1/<feature>` | 一覧取得 | `role:reader` | ✅ |
| GET | `/v1/<feature>/{id}` | 詳細取得 | `role:reader` | ✅ |
| POST | `/v1/<feature>` | 登録 | `role:editor` | ✅ |
| PATCH | `/v1/<feature>/{id}` | 更新 | `role:editor` | ⏳ review |
| DELETE | `/v1/<feature>/{id}` | 論理削除 | `role:admin` | 🚧 planned |

> 認可は `scopes` または `role` 単位で明示します。  
> “ステータス” 列は設計段階での状態管理に利用（✅=確定 / ⏳=検討中 / 🚧=未定義）。

---

# 3. リクエスト仕様

## 3.1 作成（POST /v1/<feature>）

```json
{
  "name": "string",
  "email": "string",
  "metadata": {
    "note": "string"
  }
}
````

| フィールド         | 型      | 必須 | 説明        |
| ------------- | ------ | -- | --------- |
| name          | string | ○  | 顧客名など主要属性 |
| email         | string | -  | 一意制約対象    |
| metadata.note | string | -  | 任意の備考情報   |

---

# 4. レスポンス仕様

## 4.1 作成成功（201 Created）

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "created_at": "2025-10-21T12:00:00Z"
}
```

## 4.2 エラー応答

| ステータス | コード      | メッセージ                 | 想定原因        |
| ----- | -------- | --------------------- | ----------- |
| 400   | `E40001` | Invalid request body  | バリデーションエラー  |
| 401   | `E40100` | Unauthorized          | トークン無効／期限切れ |
| 403   | `E40300` | Forbidden             | 権限なし        |
| 404   | `E40400` | Not Found             | 対象リソースなし    |
| 409   | `E40901` | Conflict              | 一意制約違反      |
| 500   | `E50000` | Internal Server Error | 想定外の例外      |

> エラーコードはアプリ全体の `guidelines/api-style.md` に準拠。

---

# 5. 関連ドキュメント

* `features/<feature>/spec.md` — 要件・ユースケース
* `features/<feature>/design.md` — 処理・トランザクション設計
* `features/<feature>/table-schema/tables.md` — テーブル構造
* `adr/adr-xxxx-authz-policy.md` — 認可ポリシー決定
* `guidelines/api-style.md` — API全体方針・命名規則

---

# 6. メモ / 補足

* クライアントは `Accept-Version` ヘッダでAPIバージョン指定。
* API変更時は `rfc/` に提案を追加し、承認後にADRへ昇格。
* AI実装エージェントはこのドキュメントを参照してエンドポイントを生成する。

---

### 💡 このテンプレートの狙い

| セクション | 目的 |
|-------------|------|
| **2〜4章** | API契約の確定（エンドポイント・データ構造・エラー） |
| **5章** | 他ドキュメントとの参照関係を示す |
| **6章** | 将来のAI実装・自動生成を見据えた補足メモ |

---
