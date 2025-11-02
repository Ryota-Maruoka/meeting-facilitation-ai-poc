---
title: "ADR-0003: Repository Pattern と Dependency Injection の統一"
status: "approved"
owner: "@backend-team"
related:
  - guidelines/backend-coding-style.md
  - apps/backend/overview.md
last_update: "2025-10-22"
confidentiality: "internal"
---

# 1. Context（背景）

## 問題の発見

2025年10月22日、Lubchart機能の `/test/stage01` エンドポイント実装時に以下の問題が発見された：

1. **命名規則の不統一**
   - Gmail/Message機能: `xxxRepository` クラス名を使用
   - Lubchart機能: `xxxDAO` クラス名を使用
   - 同じデータアクセス層で異なる命名が混在

2. **DI（Dependency Injection）機構の不統一**
   - Gmail/Message機能: `app/dependencies/factories.py` で集中管理
   - Lubchart機能: エンドポイント内で手動インスタンス化
   - コードの重複、テストの困難性、保守性の低下

3. **実装時のエラー発生**
   - 手動インスタンス化時に必須引数（`db`, `tables`, `settings`）の渡し忘れ
   - `TypeError: LubchartSourceDocumentDAO.__init__() missing 2 required positional arguments`

## 根本原因

- アーキテクチャガイドラインにRepository/DAOの命名規則が明文化されていない
- DI機構の使用ポリシーが存在しない
- 実装者が既存の「間違ったパターン」を参照してしまう

---

# 2. Decision（決定）

## 2-1. Repository命名規則の統一

**すべてのデータアクセス層クラスは `Repository` サフィックスを使用する。`DAO` は使用しない。**

```python
# ✅ 正しい命名
class LubchartSourceDocumentRepository:
    pass

class MessageRepository:
    pass

# ❌ 誤った命名（使用禁止）
class LubchartSourceDocumentDAO:  # NG
    pass
```

## 2-2. Dependency Injection機構の必須化

**すべてのRepository、Gateway、UseCaseは `app/dependencies/factories.py` で集中管理し、FastAPIの `Depends()` を使用して注入する。**

```python
# app/dependencies/factories.py
async def get_lubchart_document_repository(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    tables: Tables = Depends(get_tables)
) -> LubchartSourceDocumentRepository:
    return LubchartSourceDocumentRepository(db, tables, settings)

# app/routers/v1/lubchart.py
@router.get("/documents")
async def get_documents(
    document_repo: LubchartSourceDocumentRepository = Depends(get_lubchart_document_repository)
):
    # document_repo がすでに使える状態で注入されている
    documents = await document_repo.find_all()
    return documents
```

## 2-3. 手動インスタンス化の禁止

**エンドポイント内でのRepository/Gateway/UseCaseの手動インスタンス化を禁止する。**

```python
# ❌ 禁止パターン
@router.get("/documents")
async def get_documents(
    db=Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    tables = await Tables.create()  # NG
    document_repo = LubchartSourceDocumentRepository(db, tables, settings)  # NG

# ✅ 推奨パターン
@router.get("/documents")
async def get_documents(
    document_repo: LubchartSourceDocumentRepository = Depends(get_lubchart_document_repository)
):
    # DIで注入済み
```

---

# 3. Alternatives Considered（検討した代替案）

| No | 案 | 概要 | 採否理由 |
|----|---|------|---------|
| 1 | DAO命名に統一 | すべてDAOクラス名にする | ❌ Domain層の命名規約（Repository）と不一致 |
| 2 | Repository/DAO併用 | 用途で使い分ける | ❌ 混乱を招く。統一性がない |
| 3 | Repository命名に統一（採用） | すべてRepositoryクラス名にする | ✅ Clean Architectureの標準的なパターンに準拠 |
| 4 | 手動インスタンス化を許可 | factories.pyとの併用を認める | ❌ コードの一貫性が失われる |
| 5 | DI機構を全面的に使用（採用） | factories.pyで集中管理 | ✅ テスト容易性、保守性が向上 |

---

# 4. Consequences（影響・結果）

## 利点

- ✅ **命名の一貫性**: すべてのデータアクセス層で統一された命名規則
- ✅ **テスト容易性**: モックへの差し替えが簡単（`Depends` のオーバーライド）
- ✅ **コードの簡潔性**: エンドポイント内でのインスタンス化コードが不要
- ✅ **保守性向上**: 依存関係の管理が一箇所に集約
- ✅ **エラー防止**: 引数の渡し忘れなどの実装エラーを防止
- ✅ **パフォーマンス**: `Tables` の作成が自動的に最適化される

## トレードオフ

- ⚠️ **既存コードのリファクタリング**: Lubchart機能のすべてのエンドポイントを修正する必要がある
- ⚠️ **学習コスト**: 新規参加者がDI機構の使い方を学ぶ必要がある
- ⚠️ **ファイル追加**: `factories.py` への登録が必要

---

# 5. Implementation Notes（実装メモ）

## 5-1. 移行計画

### Phase 1: 緊急対応（即座に実施）
1. 本ADRの作成と承認
2. `backend-coding-style.md` の更新

### Phase 2: 新規実装（即座に適用）
1. 今後のすべての新規Repositoryは `xxxRepository` 命名
2. すべてのRepositoryは `factories.py` に登録
3. エンドポイントでは `Depends()` を使用

### Phase 3: 既存コードのリファクタリング（段階的に実施）
1. Lubchart機能の `xxxDAO` → `xxxRepository` リネーム
2. `factories.py` にLubchart用ファクトリー関数を追加
3. 全Lubchartエンドポイントを DI パターンに移行

## 5-2. ファイル命名規則

```
infrastructure/repositories/
├── {feature}_{resource}_repository_impl.py  # 実装ファイル
    └── class {Feature}{Resource}Repository  # クラス名

例:
├── lubchart_source_document_repository_impl.py
    └── class LubchartSourceDocumentRepository
```

## 5-3. factories.py の構成

```python
# app/dependencies/factories.py

# ============================================================
# Database Layer
# ============================================================
async def get_tables() -> Tables:
    return await Tables.create()

# ============================================================
# {Feature} Repository Layer
# ============================================================
async def get_{feature}_{resource}_repository(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    tables: Tables = Depends(get_tables)
) -> {Feature}{Resource}Repository:
    return {Feature}{Resource}Repository(db, tables, settings)

# ============================================================
# {Feature} Use Case Layer
# ============================================================
async def get_{feature}_{action}_usecase(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    {resource}_repo: {Resource}Repository = Depends(get_{resource}_repository),
    # ... 他の依存関係
) -> {Feature}{Action}Usecase:
    return {Feature}{Action}Usecase(
        settings=settings,
        db=db,
        {resource}_repository={resource}_repo,
        # ...
    )
```

## 5-4. コードレビュー時のチェックリスト

プルリクエストレビュー時に以下を確認：

- [ ] 新規Repositoryは `xxxRepository` 命名を使用しているか
- [ ] `factories.py` に登録されているか
- [ ] エンドポイントで `Depends()` を使用しているか
- [ ] 手動インスタンス化（`await Tables.create()` など）がないか

---

# 6. Status / Lifecycle

| フェーズ | 状態 | 日付 | 備考 |
|----------|------|------|------|
| 提案 | wip | 2025-10-22 | 問題発見・分析 |
| レビュー | review | 2025-10-22 | チームレビュー |
| 採択 | approved | 2025-10-22 | 即座に適用開始 |

---

# 7. References（参考資料）

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [FastAPI Dependency Injection](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [Martin Fowler - Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
