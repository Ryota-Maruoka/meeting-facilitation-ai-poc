# テーブル定義規約

## 1. テーブル命名規則

* **スネークケース（小文字 + アンダースコア区切り）**を用いる。
  例：`user_accounts`, `project_members`
* テーブル名称は**複数形**。

  * ✅ `users` / `projects`
  * ❌ `user` / `project`
* 中間テーブルは `{主テーブル名}_{従テーブル名}` とする。
  例：`project_members`, `user_roles`

---

## 2. カラム命名規則

* スネークケースを用いる。
* 意味を省略せず明示する。

  * ✅ `created_at`, `updated_at`
  * ❌ `c_at`, `upd`
* 主キーは `id` とする（UUID または bigint/serial）。
* 外部キーは `{参照先テーブル名単数形}_id` とする。
  例：`user_id`, `project_id`
* 状態や種別は ENUM を利用する場合も、カラム名は `{entity}_status`, `{entity}_type` などとする。
* 真偽値は `is_`, `has_` などを prefix にする。
  例：`is_active`, `has_permission`

---

## 3. データ型規約

* 主キーは原則 `UUID v4` を利用。
  * ただしシーケンスが適切な場合は `BIGSERIAL` も許容。
* 日時は `TIMESTAMP WITH TIME ZONE (timestamptz)` を使用。
* 文字列は原則 `TEXT`、入力長が明確に制限される場合のみ `VARCHAR(n)`。
* 金額や数量は `NUMERIC(precision, scale)` を使用。
* 論理削除が必要な場合は `deleted_at TIMESTAMPTZ NULL` を追加。

---

## 4. 共通カラム

すべての業務テーブルに以下を必須とする。

| カラム名        | 型           | 説明                                  |
| ----------- | ----------- | ----------------------------------- |
| id          | UUID (PK)   | 主キー                                 |
| created\_at | timestamptz | 作成日時（`DEFAULT now()`）               |
| updated\_at | timestamptz | 更新日時（`DEFAULT now()` + trigger で更新） |
| created\_by | UUID        | 作成ユーザーID（任意で FK）                    |
| updated\_by | UUID        | 更新ユーザーID（任意で FK）                    |
| deleted\_at | timestamptz | 論理削除日時（必要に応じて）                      |

---

## 5. 制約・インデックス

* **主キー**は必ず定義する。
* **外部キー制約**は必須。

  * `ON DELETE CASCADE` / `ON UPDATE CASCADE` は要件に応じて設定。
* **UNIQUE 制約**は業務上必要なユニーク性を保証。
* **CHECK 制約**を活用し、ビジネスルールを DB 側でも担保。
* よく検索に使うカラムにはインデックスを付与。

  * 特に外部キー、検索条件になるステータス、日時系。

---

## 6. テーブルコメント / カラムコメント

* `COMMENT ON TABLE` / `COMMENT ON COLUMN` を必須とする。
* コメントは **業務的な意味**を記載する。

  * ✅ `COMMENT ON COLUMN users.email IS 'ユーザーのログイン用メールアドレス';`
  * ❌ `COMMENT ON COLUMN users.email IS 'varchar(255)';`

---

## 7. マイグレーション運用

* Alembicを必須利用。
* `ALTER TABLE` ではなくマイグレーションファイルを通して変更する。
* enum や定数値の変更も必ずマイグレーションで管理。

---
