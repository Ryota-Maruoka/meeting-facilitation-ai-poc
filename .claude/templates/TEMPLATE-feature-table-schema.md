---
title: "<Feature>: Table Schema"
status: "wip"                        # wip | review | approved
owner: "@owner"
related: []                          # spec.md / design.md / adr.md へのリンク
last_update: "YYYY-MM-DD"
confidentiality: "internal"
---

# 1. 概要

この機能で利用するデータモデル（テーブル群）の構造・制約・方針を定義します。  
目的は「DB設計をコード生成やマイグレーションに安全に反映させること」です。

例：  
> 顧客情報（customers）および関連情報（customer_tags）を管理し、  
> テナント単位のRLSでアクセス制御を行う。

---

# 2. ER 図（機能スコープ）

- ER 図ファイル：`/images/er-<feature>.drawio`  
- 出力形式：`.drawio` または `.png`（AIエージェントが参照可能な形式推奨）

```mermaid
erDiagram
    CUSTOMERS ||--o{ CUSTOMER_TAGS : "has"
    CUSTOMERS {
        uuid id PK
        uuid tenant_id
        text name
        text email
        timestamp created_at
    }
    CUSTOMER_TAGS {
        uuid id PK
        uuid tenant_id
        uuid customer_id FK
        text tag_name
    }
````

---

# 3. テーブル定義

## 3.1 customers

| column     | type        | null | default             | note         |
| ---------- | ----------- | ---- | ------------------- | ------------ |
| id         | uuid        | no   | `gen_random_uuid()` | 主キー          |
| tenant_id  | uuid        | no   | -                   | RLSパーティションキー |
| name       | text        | no   | -                   | 顧客名          |
| email      | text        | -    | -                   | 一意制約対象       |
| created_at | timestamptz | no   | `now()`             | 作成日時         |
| updated_at | timestamptz | no   | `now()`             | 更新日時         |
| deleted_at | timestamptz | yes  | -                   | 論理削除用        |

**制約**

* `PRIMARY KEY (id)`
* `UNIQUE (tenant_id, email)`
* `CHECK (deleted_at IS NULL OR deleted_at > created_at)`

**インデックス**

* `idx_customers_tenant_id`
* `idx_customers_email`

**RLSポリシー**

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON customers
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_mod ON customers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 3.2 customer_tags

| column      | type        | null | default             | note         |
| ----------- | ----------- | ---- | ------------------- | ------------ |
| id          | uuid        | no   | `gen_random_uuid()` | 主キー          |
| tenant_id   | uuid        | no   | -                   | RLSパーティションキー |
| customer_id | uuid        | no   | FK → customers.id   | 外部キー         |
| tag_name    | text        | no   | -                   | タグ名          |
| created_at  | timestamptz | no   | `now()`             | 作成日時         |

**制約**

* `PRIMARY KEY (id)`
* `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE`

**インデックス**

* `idx_customer_tags_tenant_id`
* `idx_customer_tags_tag_name`

**RLSポリシー**

```sql
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON customer_tags
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_mod ON customer_tags
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

# 4. リレーションおよび依存関係

| 関連                        | 種別  | 説明           |
| ------------------------- | --- | ------------ |
| customers → customer_tags | 1:N | 顧客とタグの関係     |
| tenants → customers       | 1:N | テナント単位で顧客を保持 |

---

# 5. マイグレーション方針（Alembic）

| 項目     | 内容                                                 |
| ------ | -------------------------------------------------- |
| ツール    | Alembic                                            |
| 命名規則   | `<YYYYMMDD>_<feature>_<summary>.py`                |
| 実行順    | `core` → `feature` → `view`                        |
| 注意点    | `tenant_id` カラムを **NOT NULL** にすること。               |
| スクリプト例 | `alembic/versions/20251021_add_customers_table.py` |

> マイグレーションは原則**イミュータブル**（過去のファイルは改変禁止）。

---

# 6. データ初期化・サンプルデータ

```sql
INSERT INTO customers (tenant_id, name, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ACME Corp', 'info@acme.com'),
  ('00000000-0000-0000-0000-000000000001', 'FutureRays', 'contact@futurerays.co.jp');
```

> テナントIDを固定化しておくことで、E2Eテスト・ローカル開発の再現性を高める。

---

# 7. セキュリティ / RLS ポリシー設計

| 項目           | 方針                                           |
| ------------ | -------------------------------------------- |
| RLS適用        | 全テーブルに `FORCE ROW LEVEL SECURITY`            |
| tenant_id 管理 | アプリ層で `SET app.tenant_id` 実行                 |
| 監査列          | `created_at`, `updated_at`, `deleted_at` を必須 |
| アクセス権限       | SELECT / INSERT / UPDATE / DELETE を分離ポリシー化   |
| スーパー管理者      | `bypassrls` ロールを付与して監査専用アクセスを許可              |

---

# 8. データ保持 / 削除ポリシー

| 種別   | 保持期間 | 削除方法                   |
| ---- | ---- | ---------------------- |
| 顧客情報 | 5年   | 論理削除（deleted_at 設定）    |
| タグ情報 | 3年   | 顧客削除時に自動削除（FK CASCADE） |

---

# 9. 関連ドキュメント

* `features/<feature>/spec.md` — 要件・ユースケース
* `features/<feature>/design.md` — 処理・トランザクション設計
* `adr/adr-xxxx-rls-policy.md` — RLS適用方針
* `guidelines/db-style.md` — 命名・型・監査列ルール

---

# 10. 未決事項 / リスク

* テナント別に一意制約を設定するか、グローバルで共通にするか未決。
* RLSポリシーのキャッシュがパフォーマンスに影響する可能性あり。
* 論理削除とRLSの組み合わせによる整合性リスク。

---

# 11. メモ / コメント

* AIエージェントがこのファイルを読み取り、Alembicマイグレーションスクリプトを自動生成可能。
* 更新時は `last_update` を忘れずに変更すること。

---

```

---

### 💡 このテンプレートの設計意図

| セクション | 目的 |
|-------------|------|
| **1〜3章** | テーブル設計（構造・制約・RLS）を明確にして自動マイグレーション可能にする |
| **4〜5章** | 依存関係・Alembic管理ポリシーを明示し、順序制御を容易にする |
| **6章** | AIやテスト環境で利用できる再現性のあるサンプルデータを提供 |
| **7章** | RLS・bypassrlsの方針を体系化し、セキュリティ設計を自動的に反映可能にする |
| **8章** | データライフサイクル管理を含めた設計として整合性を確保 |
| **9〜11章** | ドキュメント連携とAI実装支援（リスク/未決管理含む） |

---

> **運用ポイント:**  
> - RLSポリシーは **アプリ側で必ず tenant_id を `SET` する前提**。  
> - Alembicファイルは必ず新規作成（既存上書き禁止）。  
> - AIエージェントはこのファイルを元に DDL／migration／Entity 定義を生成可能です。
```
