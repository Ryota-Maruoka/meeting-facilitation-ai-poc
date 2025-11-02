# API設計規約

## 1. エンドポイント命名規約

### 1.1 基本方針

* **RESTful** な設計を基本とする
* リソース名は**複数形**を使用（例：`/v1/projects`, `/v1/users`）
* バージョニングは **URL パスプレフィックス**で行う（例：`/v1/*`）

### 1.2 パス構造

| パターン                     | メソッド           | 用途           | 例                          |
| ------------------------ | -------------- | ------------ | -------------------------- |
| `/v1/{resources}`        | GET            | 一覧取得         | `GET /v1/projects`         |
| `/v1/{resources}`        | POST           | 新規作成         | `POST /v1/projects`        |
| `/v1/{resources}/{id}`   | GET            | 詳細取得         | `GET /v1/projects/123`     |
| `/v1/{resources}/{id}`   | PUT/PATCH      | 更新           | `PATCH /v1/projects/123`   |
| `/v1/{resources}/{id}`   | DELETE         | 削除           | `DELETE /v1/projects/123`  |
| `/v1/admin/{resources}*` | GET/POST/etc.. | 管理機能（権限必須）   | `GET /v1/admin/tenants`    |
| `/healthz`               | GET            | ヘルスチェック（L4）  | `GET /healthz`             |
| `/readyz`                | GET            | 準備完了チェック（L7） | `GET /readyz`              |

---

## 2. HTTPメソッドの使い分け

| メソッド   | 用途       | 冪等性 | 安全性 | ボディ |
| ------ | -------- | --- | --- | --- |
| GET    | リソース取得   | ✅   | ✅   | ❌   |
| POST   | リソース作成   | ❌   | ❌   | ✅   |
| PUT    | リソース全体更新 | ✅   | ❌   | ✅   |
| PATCH  | リソース部分更新 | ❌   | ❌   | ✅   |
| DELETE | リソース削除   | ✅   | ❌   | ❌   |

---

## 3. エラーモデル（統一形式）

すべてのエラーレスポンスは以下の形式で返す。

### 3.1 エラーレスポンス構造

```json
{
  "code": "string",
  "message": "string",
  "trace_id": "uuid",
  "details": {}  // 任意
}
```

| フィールド     | 型      | 必須  | 説明                          |
| --------- | ------ | --- | --------------------------- |
| code      | string | ✓   | アプリケーション固有のエラーコード（例：`INVALID_INPUT`） |
| message   | string | ✓   | 人が読むためのエラー説明                |
| trace\_id | string | ✓   | トレースID（監査・デバッグ用）            |
| details   | object |     | 追加情報（フィールドエラー等）             |

### 3.2 HTTPステータスコードの使い分け

| コード | 意味              | 使用例                          |
| --- | --------------- | ---------------------------- |
| 200 | OK              | 成功（GET/PUT/PATCH/DELETE）     |
| 201 | Created         | リソース作成成功（POST）               |
| 202 | Accepted        | 非同期処理受付                      |
| 204 | No Content      | 成功・レスポンスボディなし（DELETE等）        |
| 400 | Bad Request     | 入力不正                         |
| 401 | Unauthorized    | 未認証（トークンなし・無効・期限切れ）          |
| 403 | Forbidden       | 認証済みだが権限不足                   |
| 404 | Not Found       | リソースが存在しない                   |
| 409 | Conflict        | 競合（重複・状態不整合）                 |
| 422 | Unprocessable   | 入力形式は正しいがビジネスロジック違反          |
| 429 | Too Many Req.   | レート制限                        |
| 500 | Internal Error  | サーバ内部エラー                     |
| 502 | Bad Gateway     | 外部連携エラー                      |
| 503 | Unavailable     | サービス一時停止                     |
| 504 | Gateway Timeout | 外部連携タイムアウト                   |

---

## 4. 認証・認可

### 4.1 認証方式

* **Bearer トークン**（JWT）を使用
* Header: `Authorization: Bearer <token>`

### 4.2 必須クレーム（データプレーン）

| クレーム       | 説明                            |
| ---------- | ----------------------------- |
| `sub`      | ユーザーID（UUID）                  |
| `tenant_id` | テナントID（UUID、client_idから動的解決） |
| `role`     | ロール（例：`user`, `manager`, `admin`） |
| `exp`      | トークン有効期限                      |
| `iss`      | 発行者                           |
| `aud`      | 対象                            |

### 4.3 権限制御

* 一般エンドポイント（`/v1/*`）：`tenant_id` による分離
* 管理エンドポイント（`/v1/admin/*`）：`role=system_admin` 必須

---

## 5. リクエスト / レスポンス

### 5.1 Content-Type

| 用途                       | Content-Type              |
| ------------------------ | ------------------------- |
| 通常のリクエスト/レスポンス          | `application/json`        |
| ファイルアップロード（multipart）    | `multipart/form-data`     |
| ファイルダウンロード（バイナリ）       | `application/octet-stream` |
| PDF                      | `application/pdf`         |

### 5.2 ページング（一覧取得）

**クエリパラメータ**

| パラメータ       | 型       | デフォルト | 説明      |
| ----------- | ------- | ----- | ------- |
| `page`      | integer | 1     | ページ番号   |
| `page_size` | integer | 50    | 1ページ件数 |

**レスポンス**

```json
{
  "items": [],
  "page": 1,
  "page_size": 50,
  "total": 150
}
```

---

## 6. セキュリティヘッダ

すべてのレスポンスに以下のヘッダを付与する。

| ヘッダ                         | 値                        | 説明              |
| --------------------------- | ------------------------ | --------------- |
| `X-Content-Type-Options`    | `nosniff`                | MIME スニッフィング防止 |
| `Strict-Transport-Security` | `max-age=31536000`       | HTTPS 強制        |
| `Referrer-Policy`           | `no-referrer`            | リファラ情報を送信しない   |
| `X-Frame-Options`           | `DENY`                   | フレーム埋め込み防止      |
| `X-Trace-ID`                | `<uuid>`                 | トレースID（レスポンス）  |

---

## 7. CORS設定

| 設定                           | 値                                                     |
| ---------------------------- | ----------------------------------------------------- |
| `Access-Control-Allow-Origin` | `https://*.app.example.com`, `https://admin.example.com` |
| `Access-Control-Allow-Credentials` | `true`                                                |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, PATCH, DELETE, OPTIONS`              |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type, X-CSRF-Token`           |

---

## 8. ログ・監査

すべてのAPIリクエストで以下を記録する。

| 項目            | 説明                    |
| ------------- | --------------------- |
| `timestamp`   | リクエスト日時               |
| `user_id`     | ユーザーID（JWT `sub`）     |
| `tenant_id`   | テナントID                |
| `role`        | ロール                   |
| `action`      | HTTPメソッド + パス         |
| `resource_id` | 対象リソースID（存在する場合）      |
| `result`      | 成功/失敗（HTTPステータスコード）   |
| `trace_id`    | トレースID（X-Trace-ID）    |
| `ip`          | クライアントIPアドレス         |

**機微情報は記録しない**：JWT原文、パスワード、個人情報の詳細

---

## 9. Do / Don't

### Do（推奨）

* ✅ エラーは固定JSONフォーマットで返す
* ✅ trace_id を全レスポンスに含める
* ✅ ページングは `page` / `page_size` で統一
* ✅ リソース名は複数形
* ✅ 冪等性を意識した設計（PUT/DELETE）

### Don't（禁止）

* ❌ エラーメッセージに内部情報を露出（スタックトレース、SQL等）
* ❌ 認証なしで機微情報を返す
* ❌ HTTPステータスコードを無視（すべて200で返す等）
* ❌ クエリパラメータで機密情報を送信（JWT等）
* ❌ リソース名の単数形使用（`/v1/project` 等）

---
