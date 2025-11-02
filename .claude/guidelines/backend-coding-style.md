# バックエンド コーディングルール

（FastAPI / Clean Architecture / Alembic / SQLAlchemy Automap / ステートレス）

## 0) 前提と設計原則（再掲）

* **フレームワーク**：FastAPI (python 3.12)
* **パッケージ管理**：poetry
* **アーキ**：Clean Architecture（依存は内向き）
* **永続化**：PostgreSQL（SQLAlchemy 2.x／**Automap**）
* **マイグレーション**：**Alembic（手書き主体）**
* **I/O**：HTTPS のみ（WebSocket は対象外で開始）

---

## 1) ディレクトリの記載方法（Notation）

* 表記は **tree 形式**。
* 尖括弧の**命名トークン**を使います：

  * `<resource>` … 資源名（単数形）例: `project`
  * `<resources>` … 資源名（複数形）例: `projects`
  * `<action>` … ユースケース動詞 例: `list`/`get`/`create`/`update`/`delete`
  * `<Entity>` … エンティティ名（PascalCase）例: `Project`
* 行末の【区分】で**ファイル分離ポリシー**を明示：

  * **【\[ONE]】** … 原則 **単一ファイル**
  * **【\[PER-RESOURCE]】** … **資源ごとに分割**
  * **【\[PER-USECASE]】** … **ユースケースごとに分割**
  * **【\[PER-MIGRATION]】** … **マイグレーションごとに分割**
  * **【\[MANY]】** … 複数ファイル（分類固定せず増える）

---

## 2) ディレクトリ構成（tree & 分離ポリシーを内蔵）

```
backend/
├─ pyproject.toml                                 【[ONE]  依存・ビルド設定】
├─ alembic.ini                                    【[ONE]  Alembic 設定】
├─ alembic/                                       【[MANY] マイグレーション一式】
│  ├─ env.py                                      【[ONE]  接続/metadata 準備】
│  └─ versions/
│     └─ <timestamp>_<migration_slug>.py          【[PER-MIGRATION] 手書き DDL / Index】
└─ src/
   ├─ app/                                        【HTTP 境界（最薄）】
   │  ├─ main.py                                  【[ONE]  FastAPI 初期化・ミドルウェア・ルータ mount】
   │  ├─ routers/
   │  │  ├─ v1/
   │  │  │  └─ <resources>.py                     【[PER-RESOURCE] /v1/<resources> のHTTPパス】
   │  │  └─ health.py                             【[ONE]  /healthz, /readyz】
   │  ├─ schemas/                                 【HTTP I/O DTO】
   │  │  └─ <resource>.py                         【[PER-RESOURCE] Request/Response DTO（Pydantic）】
   │  ├─ dependencies/                            【Depends 提供】
   │  │  ├─ auth.py                               【[ONE]  JWT 検証）】
   │  │  └─ context.py                            【[ONE]  user_id / trace_id 注入】
   │  └─ errors/
   │     ├─ handlers.py                           【[ONE]  例外→HTTP 変換（固定JSON形式）】
   │     └─ types.py                              【[ONE]  エラーコード/型定義】
   │
   ├─ domain/                                     【FW 非依存の中核】
   │  ├─ entities/
   │  │  └─ <Entity>.py                           【[PER-RESOURCE] エンティティ/値オブジェクト】
   │  ├─ exceptions/
   │  │  └─ exceptions.py                         【[ONE] ドメイン例外（DuplicateEntryError等）】
   │  ├─ ports/
   │  │  └─ <interface>.py                        【[PER-RESOURCE] 外部依存の抽象IF（Logger, EventBus等）】
   │  ├─ repositories/
   │  │  └─ <resource>_repository.py              【[PER-RESOURCE] 抽象Repo（Protocol/ABC）】
   │  └─ services/
   │     └─ <resource>_policy.py                  【[PER-RESOURCE or GROUP] ドメインポリシー（業務ルールのみ）】
   │
   ├─ usecases/                                   【アプリケーション層：ユースケース単位】
   │  └─ <resource>/
   │     ├─ <action>_<resource>.py                【[PER-USECASE] 例: list_projects.py / update_project.py】
   │     └─ ...                                   【[PER-USECASE] 必要分だけ増加】
   │
   └─ infrastructure/                             【外界実装（DB/認証/S3 等）】
      ├─ db/
      │  ├─ engine.py                             【[ONE]  async Engine/SessionFactory】
      │  ├─ session.py                            【[ONE]  リクエスト単位 Session/Tx 管理】
      │  ├─ automap.py                            【[ONE]  SQLAlchemy Automap 準備・反映】
      │  └─ naming.py                             【[ONE]  naming_convention（PK/UK/FK/IX 規約）】
      ├─ repositories/
      │  └─ <resource>_repository_impl.py         【[PER-RESOURCE] 抽象Repoの実装（Automap 利用）】
      ├─ gateways/
      │  └─ <resource>_gateway.py                 【[PER-RESOURCE] 外部システムGateway（Gmail API, Bedrock等）】
      ├─ parsers/
      │  └─ <format>_parser.py                    【[PER-FORMAT] 外部フォーマット解析（PDF/Excel→Entity）】
      ├─ caching/
      │  └─ <resource>_cache.py                   【[PER-RESOURCE] データベースマスタキャッシュ（正規化・照合）】
      ├─ event_buses/
      │  └─ <bus_type>_event_bus.py               【[PER-TYPE] イベントバス実装（InMemory/SQS等）】
      ├─ event_handlers/
      │  └─ <event>_handler.py                    【[PER-EVENT] ドメインイベントハンドラ】
      ├─ publishers/
      │  └─ <target>_publisher.py                 【[PER-TARGET] メッセージパブリッシャー（SQS/SNS等）】
      ├─ helpers/
      │  ├─ date_helpers.py                       【[ONE]  日付変換・計算処理】
      │  ├─ attachment_helpers.py                 【[ONE]  添付ファイル処理】
      │  └─ file_helpers.py                       【[ONE]  ファイル操作共通処理】
      ├─ auth/
      │  ├─ oidc.py                               【[ONE]  JWKS取得・JWT検証（キャッシュ付）】
      │  └─ roles.py                              【[ONE]  役割判定】
      ├─ storage/
      │  ├─ s3_storage.py                         【[ONE]  S3署名URL発行・アクセス】
      │  ├─ local_storage.py                      【[ONE]  ローカルストレージ（開発用）】
      │  └─ google_cloud_storage.py               【[ONE]  GCS署名URL発行・アクセス（GCP用）】
      ├─ settings.py                              【[ONE]  pydantic-settings（環境変数）】
      └─ logging.py                               【[ONE]  構造化ログ（trace_id 等）】

| 対象                                                                                                       | 基準                        | 目的                               |
| -------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------- |
| 起動・横断関心（`app/main.py`, `dependencies/*`, `errors/*`, `infrastructure/db/*`, `settings.py`, `logging.py`） | **【\[ONE] 単一】**           | 配線・規約・横断関心を集中させ可読性/再現性を確保        |
| HTTP ルート（`app/routers/v1/<resources>.py`）                                                               | **【\[PER-RESOURCE] 分割】**  | 資源単位の責務分離／I/O 変更の影響範囲を限定         |
| DTO（`app/schemas/<resource>.py`）                                                                         | **【\[PER-RESOURCE] 分割】**  | Request/Response を資源ごとに管理        |
| ドメイン（`domain/entities/<Entity>.py` 等）                                                                    | **【\[PER-RESOURCE] 分割】**  | モデルの独立性を保ち拡張しやすく                 |
| ユースケース（`usecases/<resource>/<action>_<resource>.py`）                                                     | **【\[PER-USECASE] 分割】**   | 読み/書き/権限などユースケース責務を明確化           |
| 変換（`interfaces/mappers/<resource>_mapper.py`）                                                            | **【\[PER-RESOURCE] 分割】**  | ORM↔DTO/Entity の整合を一箇所に集約        |
| Repo 実装（`infrastructure/repositories/<resource>_repository_impl.py`）                                     | **【\[PER-RESOURCE] 分割】**  | Automap 依存を資源ごとに閉じ込める            |
| 外部フォーマット解析（`infrastructure/parsers/<format>_parser.py`）                                               | **【\[PER-FORMAT] 分割】**    | PDF/Excel等の技術的解析処理を隔離           |
| マスタキャッシュ（`infrastructure/caching/<resource>_cache.py`）                                                 | **【\[PER-RESOURCE] 分割】**  | DBマスタの正規化キャッシュ・高速照合           |
| イベントバス（`infrastructure/event_buses/<bus_type>_event_bus.py`）                                            | **【\[PER-TYPE] 分割】**      | イベント配信基盤の実装を切り替え可能に           |
| イベントハンドラ（`infrastructure/event_handlers/<event>_handler.py`）                                           | **【\[PER-EVENT] 分割】**     | イベント駆動処理の追加・変更を容易に            |
| メッセージパブリッシャー（`infrastructure/publishers/<target>_publisher.py`）                                       | **【\[PER-TARGET] 分割】**    | 外部メッセージング連携を対象ごとに分離          |
| 共通ヘルパー（`infrastructure/helpers/*_helpers.py`）                                                          | **【\[ONE] 単一】**           | 汎用的な変換・計算処理を集約                |
| マイグレーション（`alembic/versions/*.py`）                                                                        | **【\[PER-MIGRATION] 分割】** | DDL/Index を差分単位で追跡・ロールバック可能に |

---

## 4) 依存ライブラリ（最小）

* Web: `fastapi`, `uvicorn`（本番は `gunicorn` + `uvicorn.workers.UvicornWorker`）
* 型/設定: `pydantic` v2, `pydantic-settings`
* DB: `sqlalchemy[asyncio]` 2.x, `asyncpg`, `alembic`
* 認証/JWT: `authlib` **または** `python-jose[cryptography]`（どちらか一方）
* S3: `boto3`
* テスト: `pytest`, `pytest-asyncio`, `httpx`, `pytest-cov`

---

## 5) ルーティング規約（HTTPパス）

* ベース：**`/v1/*`**
* 401＝未認証／403＝権限不足。**エラーJSONは固定**：`{code,message,trace_id}`
* 認証が必要なエンドポイントは `Depends` でJWT検証を組み込む
---

## 6) 認証・リクエストコンテキスト（ステートレス）

* JWT の `iss/aud/exp` 検証（JWKS は短キャッシュ、`kid` 不一致はフェイルクローズ）
* `user_id`, `roles`, `trace_id` を Context に格納（Depends 注入）
* 否認時は 403 を返す
---

## 7) DB・Automap

* Automap は起動時に反映（命名規約 `naming_convention` を使用）
* **Automapの使用時は `get_reflected_base()` 関数を必ず使用**（`get_base` は存在しない、`Base`の直接importは避ける）
  - 正：`from ..db.automap import get_reflected_base` → `self.Base = get_reflected_base()`
  - 誤：`from ..db.automap import Base` → `self.Base = Base`
* 主要検索には適切な Index を設定
* 直SQLは原則禁止（ORM経由でのクエリを推奨）
---

## 8) Alembic（手書き主義）

* DDL/Index は **明示記述**、**ステージングで up/down 検証**
* 自動差分に全面依存しない（Automap 前提で誤検知が出やすい）
* マイグレーションファイルの命名規則: {version(v1)}_{DDLの説明}.py

---

## 9) リポジトリ規約と依存性注入（DI）

> **関連ADR**: [ADR-0003: Repository Pattern と Dependency Injection の統一](../adr/adr-0003-repository-pattern-and-di.md)

### 9.1 命名規則

**すべてのデータアクセス層クラスは `Repository` サフィックスを使用する。`DAO` は使用禁止。**

```python
# ✅ 正しい命名
class LubchartSourceDocumentRepository:
    pass

class MessageRepository:
    pass

# ❌ 誤った命名（使用禁止）
class LubchartSourceDocumentDAO:  # NG: DAOは使わない
    pass
```

**ファイル名とクラス名の対応**:
```
infrastructure/repositories/
├── {feature}_{resource}_repository_impl.py  # ファイル名
    └── class {Feature}{Resource}Repository  # クラス名

例:
├── lubchart_source_document_repository_impl.py
    └── class LubchartSourceDocumentRepository
├── message_repository_impl.py
    └── class MessageRepository
```

### 9.2 レイヤー配置

* **抽象Repository（インターフェース）**: `domain/repositories/{resource}_repository.py`
  - Protocol または ABC で定義
  - ドメイン層の要求する操作のみを定義
* **実装Repository**: `infrastructure/repositories/{resource}_repository_impl.py`
  - SQLAlchemy Automap を使用した具体的な実装
  - 抽象Repositoryのインターフェースを実装

### 9.3 依存性注入（DI）機構の必須使用

**すべてのRepository、Gateway、UseCaseは `app/dependencies/factories.py` で集中管理し、FastAPIの `Depends()` を使用して注入する。**

#### 9.3.1 factories.py の構成

```python
# app/dependencies/factories.py

# ============================================================
# Database Layer
# ============================================================
async def get_tables() -> Tables:
    """SQLAlchemy Automapで生成されたTablesオブジェクトを提供"""
    return await Tables.create()


# ============================================================
# Repository Layer
# ============================================================
async def get_lubchart_document_repository(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    tables: Tables = Depends(get_tables)
) -> LubchartSourceDocumentRepository:
    """LubchartSourceDocumentRepository のインスタンスを提供"""
    return LubchartSourceDocumentRepository(db, tables, settings)


# ============================================================
# Use Case Layer
# ============================================================
async def get_lubchart_upload_usecase(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    document_repo: LubchartSourceDocumentRepository = Depends(get_lubchart_document_repository),
    s3_client: S3Client = Depends(get_s3_client_for_lubchart)
) -> LubchartUploadUsecase:
    """LubchartUploadUsecase のインスタンスを提供"""
    return LubchartUploadUsecase(
        settings=settings,
        db=db,
        document_repository=document_repo,
        s3_client=s3_client
    )
```

#### 9.3.2 エンドポイントでの使用方法

```python
# ✅ 推奨パターン（DIを使用）
from app.dependencies.factories import get_lubchart_upload_usecase

@router.post("/uploads")
async def upload_pdf(
    file: UploadFile = File(...),
    usecase: LubchartUploadUsecase = Depends(get_lubchart_upload_usecase)
):
    """PDFファイルをアップロード"""
    result = await usecase.execute(...)
    return result
```

```python
# ❌ 禁止パターン（手動インスタンス化）
@router.post("/uploads")
async def upload_pdf(
    file: UploadFile = File(...),
    db=Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    # NG: エンドポイント内での手動インスタンス化は禁止
    tables = await Tables.create()  # NG
    document_repo = LubchartSourceDocumentRepository(db, tables, settings)  # NG

    result = await document_repo.create(...)
    return result
```

#### 9.3.3 DI使用の利点

1. **テスト容易性**: モックへの差し替えが簡単
   ```python
   # テストコード例
   app.dependency_overrides[get_lubchart_document_repository] = lambda: mock_repository
   ```

2. **コードの簡潔性**: エンドポイント内でのインスタンス化コードが不要

3. **保守性向上**: 依存関係の管理が一箇所に集約

4. **エラー防止**: 引数の渡し忘れなどの実装エラーを防止

5. **パフォーマンス**: `Tables` の作成が自動的に最適化される

### 9.4 Repository実装のコンストラクタ

**すべてのRepositoryは統一的なコンストラクタシグネチャを使用する**:

```python
class XxxRepository:
    def __init__(self, db: AsyncSession, tables: Tables, settings: Settings):
        """コンストラクタ

        Args:
            db: SQLAlchemyのデータベースセッション
            tables: auto_mapで取得したテーブルモデル
            settings: アプリケーションの設定
        """
        self._db = db
        self._tables = tables
        self.settings = settings
```

### 9.5 データ返却規約

* HTTP I/O には **DTO（Pydantic）** を返す
* **ORMオブジェクトの外流出は禁止**
* 変換は `interfaces/mappers` に集約（または Repository内の `_to_entity()` メソッド）

```python
# ✅ 推奨パターン
class MessageRepository:
    def _to_entity(self, record) -> Message:
        """DBレコードをエンティティに変換"""
        return Message(
            id=record.id,
            subject=record.subject,
            # ...
        )

    async def find_by_id(self, message_id: UUID) -> Optional[Message]:
        """IDでメッセージを検索"""
        result = await self._db.execute(...)
        record = result.scalar_one_or_none()
        return self._to_entity(record) if record else None

# ❌ 禁止パターン
async def find_by_id(self, message_id: UUID):
    result = await self._db.execute(...)
    return result.scalar_one_or_none()  # NG: ORMオブジェクトを直接返す
```

### 9.6 実装チェックリスト

新規Repository実装時に以下を確認：

- [ ] クラス名は `xxxRepository` になっているか（`DAO` は使っていないか）
- [ ] `factories.py` にファクトリー関数を追加したか
- [ ] コンストラクタは `(db, tables, settings)` の順序か
- [ ] エンドポイントでは `Depends()` を使用しているか
- [ ] ORMオブジェクトを直接返していないか
- [ ] `_to_entity()` メソッドで変換しているか

---

## 10) CORS / Cookie / セキュリティヘッダ

* CORS：適切なオリジンのみ許可、`Allow-Credentials: true`
* Cookie：`HttpOnly; Secure; SameSite=None; Path=/`（発行は Next.js 側）
* 代表ヘッダ：`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: no-referrer`

---

## 11) ログ / 監査 / トレーシング（最小）

* `timestamp, user_id, role, action, resource, result, trace_id, ip` を出力
* `trace_id` を全リクエストに付与（レスポンスにも返す）
* JWT 原文や機微情報は記録しない
* 監査項目：timestamp, user_id, role, resource_type, resource_id, result, trace_id, ip
---

## 12) エラーハンドリング

* 401 未認証／403 禁止／422 入力不正／404 なし／409 競合／500 内部
* すべて固定 JSON：`{ "code": "string", "message": "string", "trace_id": "uuid" }`

---

## 13) テスト（最小）

* UC 単体：Repo をモック化
* HTTP E2E：`httpx.AsyncClient`（Cookie送信含む）
* 認証テスト：正しいJWTで認可、不正なJWTで401/403

---

## 14) 実行・デプロイ（最小）

* `gunicorn -k uvicorn.workers.UvicornWorker`（ワーカー数は vCPU×2 目安）
* 環境変数：`PG*`, `JWKS_URL`, `OIDC_AUD/ISS`, `STATEMENT_TIMEOUT` 等
* ヘルス：`/healthz`（L4）／`/readyz`（DB 到達・JWKS 取得 OK）

---

## 15) Do / Don't（要点）

**Do**：DTO で境界分離／Alembic は手書き／適切な Index 設定／ORM経由でのクエリ
**Don't**：直SQL乱用／Automap 生成物を改変／詳細な内部をエラーメッセージに露出

---

了解。フロント側に合わせて、**「分離・凝集・疎結合」**と**「サイズ（行数/関数長/複雑度）」**のルールを**バックエンド**にも追記します。既存番号を保つため、**16)** と **17)** として末尾に差し込んでください。

---

## 16) ソースコードの**分離・凝集・疎結合**（設計規約）

### 16.1 レイヤ境界と依存方向（内向きのみ）

* 依存の矢印は **外 → 内** に限定：
  `app (HTTP境界) → usecases (アプリケーション層) → domain (エンティティ/ポリシー) → infrastructure (実装は外で注入)`
* **禁止**：

  * `infrastructure` から `usecases` / `app` / `domain` への逆依存
  * `app.routers` から `infrastructure.*` を **直接 import**（依存は **usecases** 経由）
  * `domain` から外界（DB/S3/HTTP）への依存
* **許可/推奨**：

  * `usecases` は **抽象Repo（domain.repositories）** にのみ依存し、実装は起動時 DI で差し替え
  * 変換（ORM⇄DTO/Entity）は **interfaces.mappers** に集約（ルータやユースケースに分散させない）

### 16.2 モジュールの**凝集**（1ファイル=1責務）

* `routers`：HTTP の**入出力と権限ガード**のみ。**ビジネスロジック/DB呼び出し禁止**
* `usecases`：1ユースケース=1モジュール（`list_projects.py` 等）。**Tx 境界・権限チェックの最終責務**を持つ
* `domain.entities`：値オブジェクト/不変条件/ドメインメソッドを**ここに閉じる**
* `infrastructure.repositories`：**ORM 専用**（クエリ最適化/Index ヒント/トランザクション管理の実装）
* `interfaces.mappers`：**DTO/Entity/ORM** の**相互変換の唯一の置き場**

### 16.3 疎結合（契約駆動）

* **抽象Repo**：`Protocol` / `ABC` で**契約（IF）を先に定義**し、実装は `infrastructure/..._impl.py`
* **DTO固定**：HTTP I/O は **Pydantic DTO** で固定。**ORM オブジェクトの外流出禁止**
* **設定/外部接続**：`settings.py` に一元化。**環境変数の直読**を各所で行わない
* **副作用の隔離**：S3・メール送信・外部API は **infrastructure のゲートウェイ**に隔離し、UC からは IF 経由で呼ぶ

### 16.4 import ルール（境界ガード）

* `app/*` → `usecases/*`, `app/schemas/*`, `app/permissions/*` のみ
* `usecases/*` → `domain/*`, `interfaces/mappers/*`, `domain/repositories/*`（**impl禁止**）
* `domain/*` → **標準ライブラリのみ**（外部FWへの依存禁止）
* `infrastructure/*` → `domain/repositories/*`（抽象） と `infrastructure/db/*` など内部実装は自由
* **循環依存禁止**（ruff/mypy で検出）

### 16.5 取引（Transaction）とコンテキスト

* **Tx 境界は UC（usecases）**。**routers で begin しない**
* `Session` は **リクエスト単位 DI**（`Depends`）で供給、UC 内で `commit/rollback` を完結

### 16.6 例外とエラー設計

* インフラ層例外は **ドメイン/UC向けのカスタム例外**に変換
* ルータでは **ハンドラ**に集約して HTTP 化（同じ例外を各所で個別にJSON化しない）

---

## 17) **サイズ規約（行数 / 関数長 / 複雑度）**（ruff + flake8 + mypyで強制）

### 17.1 ファイル行数・公開要素

* **最大行数（コメント含む、空行除外してよい）**

  * ルータ（`app/routers/*`）: **≤ 250 行**
  * ユースケース（`usecases/*`）: **≤ 200 行**
  * リポジトリ実装（`infrastructure/repositories/*_impl.py`）: **≤ 250 行**
  * エンティティ/VO（`domain/entities/*`）: **≤ 200 行**
  * 変換/マッパ（`interfaces/mappers/*`）: **≤ 200 行**
* **公開関数/クラス数**

  * 1モジュール **公開シンボルは最大 5 個**（`__all__` または命名規約で管理）

### 17.2 関数長・引数数・ネスト

* **関数長**

  * 通常関数/UC：**≤ 50 行**
  * ルータ関数：**≤ 40 行**（I/O と UC 呼出しのみに留める）
* **引数数**：**≤ 6**（超える場合は `@dataclass`/DTO を用意して束ねる）
* **ネスト深さ**：**3 段まで**（条件分岐/ループ/with）
* **早期 return** でガード節を置き、分岐を平坦化

### 17.3 複雑度（Cyclomatic / Cognitive）

* **Cyclomatic Complexity**：**≤ 10**
* **Cognitive Complexity**：**≤ 15**

  * 超過時は **関数分割**、**戦略オブジェクト化（Policy/Spec）**、**マッパ切り出し**で是正

### 17.4 クエリとマッパの分割基準

* SQLAlchemy クエリが \*\*5 句（join/filter/order/group/having など）\*\*を超える場合は

  * **クエリビルダ関数**へ抽出（`_build_find_projects_query()` など）
  * 返却前に **マッパで DTO/Entity に変換**（ルータ/UC に ORM を出さない）

### 17.5 Docstring / 型付け

* **公開関数/メソッド**は **1行サマリ + 引数/戻り値の型ヒント必須**
* **mypy: strict** を基準（`disallow_untyped_defs = True`, `no_implicit_optional = True`）

### 17.6 例外扱い

* 一時的に上限を越える場合は **`# TODO(length|complexity): <理由> (Issue #123)`** を明記し、**次スプリントで解消計画**を残す

---

## 18) **domain/services と infrastructure/services の明確な区別**

### 18.1 domain/services（ドメインサービス）

**定義**: **業務ルール（ビジネスロジック）のみ**を扱うサービス

**配置基準**:
* 複数のエンティティにまたがる**ビジネスルール**
* **技術的実装に依存しない**純粋なドメインロジック
* **標準ライブラリのみ**に依存（外部FW/DB/API禁止）

**例**:
* 価格計算ポリシー（割引ルール、税込計算）
* 在庫チェックロジック（複数倉庫の在庫確認）
* 見積もり承認ルール（承認フロー判定）

**禁止事項**:
* DB アクセス（Repository も禁止）
* 外部 API 呼び出し
* S3/ファイルシステムアクセス
* Logger/Settings 等の infrastructure 依存

**サンプル**:
```python
# domain/services/pricing_policy.py
class PricingPolicy:
    """価格計算ドメインポリシー（純粋なビジネスルール）"""
    def calculate_total_price(self, items: List[Item], customer_rank: str) -> Decimal:
        base_price = sum(item.unit_price * item.quantity for item in items)
        discount_rate = self._get_discount_rate(customer_rank)
        return base_price * (1 - discount_rate)

    def _get_discount_rate(self, customer_rank: str) -> Decimal:
        # 業務ルールのみ（外部依存なし）
        return Decimal("0.1") if customer_rank == "gold" else Decimal("0")
```

---

### 18.2 infrastructure/gateways（外部システムゲートウェイ）

**定義**: **外部システム・技術的実装**との連携を担当するゲートウェイ

**配置基準**:
* 外部 API 呼び出し（Gmail API, Slack API 等）
* ストレージ操作（S3 アップロード/ダウンロード）
* メール送信、SMS 送信
* ファイル変換（PDF 生成、画像リサイズ）
* **技術的な詳細実装**を隠蔽

**例**:
* `GmailGateway`: Gmail API との通信
* `MessageStorageGateway`: S3 へのメッセージ保存
* `PdfGeneratorGateway`: PDF 生成
* `SlackNotificationGateway`: Slack 通知

**許可される依存**:
* `infrastructure` 内の他モジュール（DB, Storage, Logger 等）
* 外部ライブラリ（`boto3`, `requests`, `httpx` 等）
* `domain/entities`（データ構造として）
* `domain/ports`（インターフェース実装のため）

**禁止事項**:
* ビジネスルールの実装（それは `domain` か `usecases` に配置）
* トランザクション管理（それは `usecases` の責務）

**サンプル**:
```python
# infrastructure/gateways/gmail_gateway.py
from infrastructure.external_api.gmail_client import GmailClient
from infrastructure.logging import logger
from domain.entities.gmail_raw_message import GmailRawMessage

class GmailGateway:
    """Gmail APIとの通信を担当（技術実装）"""
    def __init__(self, gmail_client: GmailClient, tmp_storage_path: str):
        self.gmail_client = gmail_client
        self.tmp_storage_path = tmp_storage_path

    async def fetch_message(self, message_id: str) -> Optional[GmailRawMessage]:
        """Gmail APIから単一メッセージを取得"""
        logger.info(f"Fetching message: {message_id}")
        return await self.gmail_client.fetch_message(message_id, self.tmp_storage_path)
```

---

### 18.3 責務分離の判断フロー

新しいクラスを作成する際の判断フロー：

```
Q1: 外部システム（API/DB/S3）にアクセスするか？
  YES → infrastructure/gateways

Q2: 業務ルール（ビジネスロジック）を実装するか？
  YES → domain/services（ただし外部依存がないこと）

Q3: 複数のサービス/リポジトリを組み合わせて処理を orchestration するか？
  YES → usecases（アプリケーション層）

Q4: HTTP I/O の変換のみか？
  YES → interfaces/mappers または app/schemas
```

---

### 18.4 過去の誤配置の修正方針

**現在の `domain/services/` に存在する誤配置**:
* `GmailService` → `infrastructure/gateways/gmail_gateway.py` に移動（外部API依存）
* `MessageService` → ユースケースに分解（orchestration責務）
* `HistoryCursorService` → `infrastructure/gateways/` または削除（Repository直接使用）

**正しい配置後**:
```
domain/services/
  └─ (業務ルールがあれば残す、なければ削除)

infrastructure/gateways/
  ├─ gmail_gateway.py           # Gmail API通信
  └─ message_storage_gateway.py # S3アップロード

usecases/gmail/
  └─ gmail_regist_usecase.py    # orchestration（Gmail API取得 + DB登録 + S3保存）
```

---

## 19) **infrastructure 配下の新ディレクトリ詳細定義**

### 19.1 infrastructure/parsers/（外部フォーマット解析）

**定義**: **外部ファイルフォーマット（PDF/Excel等）の技術的解析**を担当

**配置基準**:
* PyPDF2, pandas, openpyxl 等の**技術的ライブラリ**を使用する処理
* PDF/Excel/CSV等の構造化されたデータを**ドメインエンティティに変換**
* ファイルフォーマット固有の解析ロジック（正規表現、セル結合処理等）

**例**:
* `ENEOSInvoiceParser`: ENEOS請求書（PDF+Excel）の解析
* `CSVDataParser`: 汎用CSVデータの解析
* `XMLConfigParser`: XML設定ファイルの解析

**責務**:
* ファイルからのテキスト/データ抽出
* 構造化データへの変換（dataclass/Entity生成）
* フォーマットエラーの検出と例外発生

**禁止事項**:
* ビジネスルール（それは`domain/services`へ）
* DB永続化処理（それは`usecases`経由で`repositories`へ）
* S3等の外部ストレージアクセス（それは`gateways`へ）

---

### 19.2 infrastructure/event_buses/（イベントバス実装）

**定義**: **ドメインイベントの配信基盤**を提供

**配置基準**:
* イベントの発行（publish）と購読（subscribe）の実装
* 複数の実装を切り替え可能（InMemory/SQS/EventBridge等）
* `domain/ports/event_bus.py`インターフェースの実装

**例**:
* `InMemoryEventBus`: 同期的なイベント配信（開発/テスト用）
* `SQSEventBus`: AWS SQS経由の非同期イベント配信
* `EventBridgeEventBus`: AWS EventBridge経由の配信

**責務**:
* イベントの一時保持と配送
* ハンドラの登録・呼び出し
* 配送失敗時のリトライ・エラーハンドリング

**禁止事項**:
* ビジネスロジックの実装（それは`event_handlers`またはドメインへ）
* 直接のDB操作（それはハンドラ経由で）

---

### 19.3 infrastructure/event_handlers/（イベントハンドラ）

**定義**: **ドメインイベント発生時の副作用処理**を実装

**配置基準**:
* ドメインイベント発生後の**技術的な副作用**を実装
* メール送信、外部API呼び出し、キャッシュ無効化等
* 複数のリポジトリ/ゲートウェイを協調させる処理

**例**:
* `NewMessageRegisteredHandler`: メッセージ登録後のS3保存・解析キュー投入
* `InvoiceCreatedHandler`: 請求書作成後のメール通知
* `UserRegisteredHandler`: ユーザー登録後のウェルカムメール送信

**責務**:
* イベント受信と処理の orchestration
* 外部システムへの通知（Gateway経由）
* DB更新（Repository経由）

**禁止事項**:
* ドメインの不変条件変更（それは`usecases`で）
* 同期的な長時間処理（非同期化推奨）

---

### 19.4 infrastructure/publishers/（メッセージパブリッシャー）

**定義**: **外部メッセージングシステム**へのメッセージ送信を担当

**配置基準**:
* SQS/SNS/Kinesis等の**メッセージング技術**との連携
* メッセージのシリアライズ・エンベロープ生成
* 配信失敗時のリトライ・DLQ処理

**例**:
* `SQSMessagePublisher`: AWS SQSへのメッセージ送信
* `SNSMessagePublisher`: AWS SNSへのトピック発行
* `KinesisPublisher`: AWS Kinesisへのストリーム送信

**責務**:
* メッセージフォーマット変換（dict → JSON/MessageAttributes）
* 配信先エンドポイントの管理
* 送信ログ・メトリクス記録

**禁止事項**:
* ビジネスロジック（それは`usecases`へ）
* 直接のDB操作（それは`repositories`へ）

**Event BusesとPublishersの違い**:
* **Event Buses**: アプリケーション**内部**のドメインイベント配信（同一プロセス or 同一システム内）
* **Publishers**: アプリケーション**外部**へのメッセージ送信（他マイクロサービス、バッチ処理等）

---

### 19.5 infrastructure/helpers/（共通ヘルパー）

**定義**: **技術的な共通処理**を集約（旧`utils/`を整理統合）

**配置基準**:
* 複数レイヤで使用される**技術的な変換・計算処理**
* ドメイン知識を持たない純粋な関数/クラス
* **標準ライブラリ + 最小限の外部ライブラリ**のみ使用

**ファイル構成**:
```python
# date_helpers.py - 日付変換・計算
def ms_timestamp_to_datetime(ms: int) -> datetime: ...
def parse_iso_date(date_str: str) -> date: ...

# attachment_helpers.py - 添付ファイル処理
def process_attachment(file_path: str) -> ProcessedAttachment: ...
def validate_mime_type(mime: str) -> bool: ...

# file_helpers.py - ファイル操作
def office_to_pdf(src: str, dst: str) -> bool: ...
def sanitize_filename(name: str) -> str: ...
```

**責務**:
* 汎用的な変換処理（日付、文字列、ファイル等）
* バリデーション・サニタイズ処理
* フォーマット変換（Office→PDF等）

**禁止事項**:
* ビジネスルール（それは`domain/services`へ）
* DB/外部APIアクセス（それは`gateways`へ）
* 大きなクラス実装（関数中心に保つ）

**helpers vs gateways の判断**:
* **Helpers**: 純粋関数、外部システムに依存しない（例：日付変換、文字列処理）
* **Gateways**: 外部システム/API/ストレージに依存する（例：Gmail API、S3、Bedrock）

---

### 19.6 infrastructure/caching/（マスタキャッシュ）

**定義**: **データベースマスタの正規化キャッシュ**を提供

**配置基準**:
* DBマスタテーブルから全件ロードし、メモリ上で高速照合を行う
* 正規化（NFKC、大文字化、記号除去）を適用してキャッシュに格納
* 完全一致、Fuzzyマッチング用のデータ構造を提供
* 複数ユースケースで共有される照合処理の基盤

**例**:
* `LubchartMachineryCache`: machinery名の辞書キャッシュ
* `LubchartAliasCache`: エイリアス辞書キャッシュ
* `LubchartMasterCache`: 汎用マスタキャッシュ（maker, lubricant等）

**責務**:
* DBからマスタデータの全件ロード
* 正規化処理を適用した高速検索用キャッシュ
* 完全一致検索・Fuzzyマッチング用データ提供
* キャッシュの自動更新（新規マスタ作成時）

**禁止事項**:
* ビジネスルール（それは`domain/services`へ）
* 複雑なマッチングロジック（それは`domain/services`またはヘルパーへ）
* トランザクション管理（それは`usecases`の責務）

**サンプル**:
```python
# infrastructure/caching/lubchart_machinery_cache.py
from typing import Set, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from infrastructure.db.models.tables import Tables

class LubchartMachineryCache:
    """Machinery名の辞書キャッシュ"""

    def __init__(self, db: AsyncSession, tables: Tables):
        self.db = db
        self.tables = tables
        self._cache: Set[str] = set()
        self._loaded_at: Optional[datetime] = None

    async def load(self) -> None:
        """DBからmachinery名を全件ロード（正規化して格納）"""
        result = await self.db.execute(
            select(self.tables.LubchartMachinery.name)
        )
        raw_names = result.scalars().all()
        self._cache = {self._normalize(name) for name in raw_names}
        self._loaded_at = datetime.now()

    def is_registered(self, machinery_name: str) -> bool:
        """machinery_nameが辞書に登録されているか判定"""
        normalized = self._normalize(machinery_name)
        return normalized in self._cache

    @staticmethod
    def _normalize(text: str) -> str:
        """正規化（大文字化、全角→半角、記号除去）"""
        import unicodedata
        normalized = unicodedata.normalize('NFKC', text)
        normalized = normalized.upper()
        normalized = ''.join(c for c in normalized if c.isalnum())
        return normalized
```

**caching vs repositories の判断**:
* **Caching**: 読み取り専用の高速照合・全件ロード・正規化検索
* **Repositories**: CRUD操作・トランザクション管理・条件検索

---
