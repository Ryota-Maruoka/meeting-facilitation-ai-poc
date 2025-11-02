---
title: "ADR: <Decision Title>"
status: "wip"                        # wip | review | approved | superseded
owner: "@owner"
related: []                          # 関連するRFCやFeature Specを配列で記述
last_update: "YYYY-MM-DD"
confidentiality: "internal"          # internal | confidential | public
---

# 1. Context（背景）

- この意思決定が必要になった**背景・課題・制約条件**を記述します。  
- 例）テナント分離を強化する必要があり、RLS適用方針を検討した。  
- 例）APIバージョニング方法の混在が発生しているため、標準化を行う。

---

# 2. Decision（決定）

- 採択した**最終的な方針・設計上の決定事項**を明確に記述します。  
- 1〜3行で完結に、「〜とする」「〜を採用する」の形式が望ましい。  

例：
> PostgreSQL Row-Level Security (RLS) を全テーブルに適用し、`tenant_id` を強制的に利用する。  
> APIのバージョニングは URL ではなく `Accept-Version` ヘッダーで管理する。

---

# 3. Alternatives Considered（検討した代替案）

| No | 案 | 概要 | 理由 |
|----|----|------|------|
| 1 | アプリ層でのフィルタ | ORMでtenant_idを自動付与 | 不整合リスクが高い |
| 2 | DB分割 | テナントごとにDBを分ける | コストと運用負荷が増大 |
| 3 | RLS (採用) | DBレベルで強制 | 一貫性とセキュリティを確保 |

> *※この表形式は省略可。選択理由と却下理由を文章で記載しても良い。*

---

# 4. Consequences（影響・結果）

- この決定により生じる **利点とトレードオフ** を列挙します。

例：
- ✅ セキュリティ強化（アプリ層のバグによるデータ漏洩を防止）  
- ⚠️ マイグレーション・テスト時にRLSの切替が必要  
- ⚠️ SQLの一部が `SET app.tenant_id` 前提で動作

---

# 5. Implementation Notes（実装メモ）

- 実装・反映時に注意すべき事項を補足します。  
- 例）`alembic` マイグレーションでは `FORCE ROW LEVEL SECURITY` を付与。  
- 例）FastAPI ミドルウェアで `SET app.tenant_id` をリクエスト単位に発行。

---

# 6. Status / Lifecycle

| フェーズ | 状態 | 備考 |
|-----------|------|------|
| 提案 | wip | 検討中 |
| レビュー | review | 関係者レビュー中 |
| 採択 | approved | 実施済み |
| 廃止・置換 | superseded | 新ADRで置換（下記参照） |
