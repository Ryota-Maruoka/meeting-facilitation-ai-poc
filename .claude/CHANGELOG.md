# 設計書変更履歴

## 2025-01-25: 新ディレクトリ構造への移行

### 変更概要

README.md の最新設計仕様に基づいて、設計書を新しいディレクトリ構造に配置転換。

### 変更内容

#### 1. guidelines/ への移動（横断ルール・規約）
- `definition/02.table-rule.md` → `guidelines/db-style.md`
- `definition/05-1.frontend-coding-rule.md` → `guidelines/frontend-coding-style.md`
- `definition/05-2.backend-coding-rule.md` → `guidelines/backend-coding-style.md`
- 新規作成: `guidelines/api-style.md`（エラーモデル、API命名規約）

#### 2. apps/backend/ への移動（アプリケーション全体設計）
- `definition/03.architecture.md` → `apps/backend/overview.md`
- `definition/07.environment.md` → `apps/backend/environment.md`

#### 3. features/lubchart/ への統合（ルブチャート解析機能）
- `definition/01.specification.md`（lubchart部分） → `features/lubchart/spec.md`
- `definition/01.specification/01.lubchart/processing_flow.md` → `features/lubchart/design.md`
- `definition/01.specification/01.lubchart/api.md` → `features/lubchart/api/contracts.md`
- `definition/02-1.lubchart-table-schema.md` → `features/lubchart/table-schema/tables.md`
- 新規作成: `features/lubchart/changelog.md`

#### 4. features/gmail/ への統合（Gmail解析機能・未実装）
- `definition/01.specification.md`（gmail部分） → `features/gmail/spec.md`（プレースホルダ）
- 新規作成: `features/gmail/design.md`（プレースホルダ）
- 新規作成: `features/gmail/changelog.md`

#### 5. その他
- 新規作成: `.claude/INDEX.md`（ドキュメント一覧）
- `definition/CHANGELOG.md` → `.claude/CHANGELOG.md`（本ファイル）
- 削除: `definition/` ディレクトリ全体

### 影響範囲

* 設計書の配置のみ変更、実装コードへの影響なし
* 既存の参照リンクは新しいパスに更新済み

### 新ディレクトリ構成

```
.claude/
├── README.md
├── INDEX.md
├── CHANGELOG.md
├── guidelines/
│   ├── db-style.md
│   ├── api-style.md
│   ├── frontend-coding-style.md
│   └── backend-coding-style.md
├── apps/
│   └── backend/
│       ├── overview.md
│       └── environment.md
├── features/
│   ├── lubchart/
│   │   ├── spec.md
│   │   ├── design.md
│   │   ├── changelog.md
│   │   ├── api/
│   │   │   └── contracts.md
│   │   └── table-schema/
│   │       └── tables.md
│   └── gmail/
│       ├── spec.md (未実装・プレースホルダ)
│       ├── design.md (未実装・プレースホルダ)
│       └── changelog.md
└── templates/
    ├── TEMPLATE-feature-spec.md
    ├── TEMPLATE-feature-design.md
    ├── TEMPLATE-feature-api.md
    ├── TEMPLATE-feature-table-schema.md
    ├── TEMPLATE-adr.md
    └── TEMPLATE-rfc.md
```

---

## 2025-01-25以前: client_idベースのテナント識別方式への移行

### 変更概要

JWTトークンの `client_id` からテナントを識別する方式に変更。Cognitoカスタム属性への依存を削減。

### 変更対象ファイル（当時の構成）

#### 1. 認証方式定義書（08.authentication.md）
- **3.2 認証フロー**: client_idを使用した識別方式に更新
- **3.3 テナント識別ロジック**: API側でのclient_id解決プロセスを追加
- **4.2 カスタム属性**: `custom:tenant_id` を削除（client_idから動的解決）
- **9章 追加**: client_idベースのテナント識別の詳細仕様を追加

#### 2. 認可方式定義書（06.authorization.md）
- **2. 前提・用語**: tenant_idがclient_idから導出されることを明記
- **4. 判定順序**: client_id抽出とテナント解決のステップを追加

### 主な変更点

1. **テナント識別方法の変更**
   - 旧: Cognitoカスタム属性 `custom:tenant_id` を使用
   - 新: アクセストークンの `client_id` から動的に解決

2. **処理フロー**
   ```
   1. JWTトークンから client_id を抽出
   2. tenant_app_clients テーブルで client_id を検索
   3. 取得したアプリクライアント情報でトークン検証
   4. アプリクライアント情報から tenant_id を確定
   ```

3. **メリット**
   - Cognitoカスタム属性の管理が不要
   - ユーザーが複数テナントに所属する場合の柔軟性向上
   - client_idは改ざん不可能な値のためセキュリティ向上

### 影響範囲

- バックエンドの認証ミドルウェア
- フロントエンドはNextAuth設定の調整のみ（カスタム属性不要）
- 既存のDBスキーマは変更なし（tenant_app_clientsテーブルを活用）

### 移行方針

- 新規テナントは新方式で実装
- 既存テナントは段階的に移行
- カスタム属性は互換性のため残すが、使用しない

---

## 2025-01-24以前の変更

（過去の変更履歴をここに記載）
