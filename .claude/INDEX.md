---
title: "設計書一覧 - Meeting Facilitation AI PoC"
last_update: "2025-02-11"
---

# 📚 .claude ドキュメント一覧

このファイルは `.claude/` 配下の重要ドキュメントを一覧化し、最新更新を記録します。

---

## 🏗️ 運用ルール・方針

| ドキュメント | 説明 | 最終更新 |
|------------|------|----------|
| [README.md](README.md) | 本ディレクトリの運用方針・ディレクトリ構成説明 | 2025-01-25 |
| [CHANGELOG.md](CHANGELOG.md) | システム全体の設計変更履歴 | 2025-01-25 |
| [INDEX.md](INDEX.md) | 本ファイル（ドキュメント一覧） | 2025-02-11 |

---

## 🏢 アプリケーション全体の設計（apps/）

### Backend

| ドキュメント | 説明 | 最終更新 |
|------------|------|----------|
| [apps/backend/overview.md](apps/backend/overview.md) | バックエンドアーキテクチャ概要 | 2025-02-11 |
| [apps/backend/storage-design.md](apps/backend/storage-design.md) | データストレージ設計書 | 2025-02-11 |
| [apps/backend/environment-design.md](apps/backend/environment-design.md) | 環境変数設計書 | 2025-02-11 |

**主要内容**:
- FastAPI + Python 3.11+の技術スタック
- 会議管理・音声文字起こし・要約生成・脱線検知などの主要機能
- Azure OpenAI API連携
- JSONファイルベースのデータストレージ
- API仕様・データモデル・環境変数設定
- データストレージ詳細仕様（JSONファイル構造、DataStoreクラスAPI）
- 環境変数一覧と環境別設定値（dev/staging/prod）

### Frontend

| ドキュメント | 説明 | 最終更新 |
|------------|------|----------|
| [apps/frontend/overview.md](apps/frontend/overview.md) | フロントエンドアーキテクチャ概要 | 2025-02-11 |

**主要内容**:
- Next.js 14 App Router + TypeScript構成
- Material-UI + Tailwind CSS
- 主要画面（会議履歴・会議作成・会議進行中・会議レポート）
- APIクライアント実装・型マッピング
- カスタムHooks（useMeeting, useMeetings, useDeviationDetection）

---

## 🧩 機能別設計（features/）

### 会議管理機能（meetings/）

| ドキュメント | 説明 | 最終更新 |
|------------|------|----------|
| [features/meetings/spec.md](features/meetings/spec.md) | 要件定義書 | 2025-02-11 |
| [features/meetings/design.md](features/meetings/design.md) | 処理設計書 | 2025-02-11 |
| [features/meetings/api/contracts.md](features/meetings/api/contracts.md) | API契約書 | 2025-02-11 |

**機能概要**:
- 会議のライフサイクル管理（作成・開始・進行中・終了）
- リアルタイム音声文字起こし（Azure OpenAI Whisper）
- 脱線検知アラート（LLMベース）
- ミニ要約生成（3分ごと）
- 最終サマリ生成（会議終了時）
- Parking Lot（後回し項目）管理

**主要API**:
- `POST /meetings` - 会議作成
- `POST /meetings/{id}/start` - 会議開始
- `POST /meetings/{id}/end` - 会議終了
- `GET /meetings` - 会議一覧取得
- `GET /meetings/{id}` - 会議詳細取得
- `PUT /meetings/{id}` - 会議更新
- `DELETE /meetings/{id}` - 会議削除

---

## 🧭 ADR（Architecture Decision Record）

| No | ドキュメント | 説明 | 状態 | 最終更新 |
|----|------------|------|------|---------|
| 0003 | [adr/adr-0003-repository-pattern-and-di.md](adr/adr-0003-repository-pattern-and-di.md) | Repository Pattern と Dependency Injection の統一 | approved | 2025-10-22 |

### テンプレート

* [TEMPLATE-adr.md](templates/TEMPLATE-adr.md)

---

## 💬 RFC（Request for Comments）

現在、RFC は作成されていません。提案・議論段階のドキュメントは `rfc/` 配下に作成してください。

### テンプレート

* [TEMPLATE-rfc.md](templates/TEMPLATE-rfc.md)

---

## 📝 テンプレート一覧（templates/）

| ファイル | 説明 |
|---------|------|
| [TEMPLATE-feature-spec.md](templates/TEMPLATE-feature-spec.md) | 機能仕様テンプレート |
| [TEMPLATE-feature-design.md](templates/TEMPLATE-feature-design.md) | 機能設計テンプレート |
| [TEMPLATE-feature-api.md](templates/TEMPLATE-feature-api.md) | API契約テンプレート |
| [TEMPLATE-feature-table-schema.md](templates/TEMPLATE-feature-table-schema.md) | テーブル定義テンプレート |
| [TEMPLATE-adr.md](templates/TEMPLATE-adr.md) | ADRテンプレート |
| [TEMPLATE-rfc.md](templates/TEMPLATE-rfc.md) | RFCテンプレート |

---

## 📅 最近の更新（直近7件）

| 日付 | ドキュメント | 変更内容 |
|------|------------|---------|
| 2025-02-11 | apps/backend/storage-design.md | データストレージ設計書を作成 |
| 2025-02-11 | apps/backend/environment-design.md | 環境変数設計書を作成 |
| 2025-02-11 | apps/backend/overview.md | バックエンドアーキテクチャ概要を更新 |
| 2025-02-11 | apps/frontend/overview.md | フロントエンドアーキテクチャ概要を更新 |
| 2025-02-11 | features/meetings/spec.md | 会議管理機能の要件定義書を作成 |
| 2025-02-11 | features/meetings/design.md | 会議管理機能の処理設計書を作成 |
| 2025-02-11 | features/meetings/api/contracts.md | 会議管理APIの契約書を作成 |

---

## 🔍 ドキュメント検索のヒント

### 用途別の参照先

| やりたいこと | 参照先 |
|------------|-------|
| プロジェクト全体を理解したい | [README.md](README.md) / [apps/backend/overview.md](apps/backend/overview.md) / [apps/frontend/overview.md](apps/frontend/overview.md) |
| 会議管理機能の要件を確認したい | [features/meetings/spec.md](features/meetings/spec.md) |
| 会議管理機能の処理フローを確認したい | [features/meetings/design.md](features/meetings/design.md) |
| 会議管理APIの仕様を確認したい | [features/meetings/api/contracts.md](features/meetings/api/contracts.md) |
| データストレージの仕様を確認したい | [apps/backend/storage-design.md](apps/backend/storage-design.md) |
| 環境変数設定を確認したい | [apps/backend/environment-design.md](apps/backend/environment-design.md) |
| データモデルを確認したい | [features/meetings/spec.md § 5](features/meetings/spec.md) |
| 新機能の設計を始めたい | [TEMPLATE-feature-spec.md](templates/TEMPLATE-feature-spec.md) をコピー |
| アーキテクチャ決定を記録したい | [TEMPLATE-adr.md](templates/TEMPLATE-adr.md) をコピーして `adr/` 配下に作成 |
| 提案・議論を始めたい | [TEMPLATE-rfc.md](templates/TEMPLATE-rfc.md) をコピーして `rfc/` 配下に作成 |

### ファイル横断検索

```bash
# .claude配下のMarkdownファイルを検索
grep -r "キーワード" .claude/*.md

# 会議管理機能の設計書のみ検索
grep -r "キーワード" .claude/features/meetings/*.md
```

---

## 📌 メンテナンスルール

* **週1回更新**：最近の更新セクションを手動で更新（重要な変更のみ）
* **重要ドキュメント追加時**：該当セクションに行を追加
* **ドキュメント削除時**：INDEX からも削除し、理由を CHANGELOG に記録

---

## 📞 サポート

設計書に関する質問や改善提案は、以下の方法で連絡してください：

- **GitHub Issues**: プロジェクトリポジトリのIssuesセクション
- **Pull Request**: 設計書の更新はPRで提案
- **ドキュメント改善**: README.mdの運用方針を参照

---

## 📌 関連リンク

- [プロジェクトREADME](../README.md)
- [バックエンドREADME](../backend/README.md)
- [フロントエンドREADME](../frontend/README.md)
- [セットアップガイド](../SETUP_GUIDE.md)
