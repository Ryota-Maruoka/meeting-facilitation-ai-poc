---
title: "RFC: <Proposal Title>"
status: "wip"                        # wip | review | accepted | rejected | superseded
owner: "@owner"
reviewers: ["@reviewer1", "@reviewer2"]
related: []                          # 関連ADRやFeature Spec, Design等
last_update: "YYYY-MM-DD"
confidentiality: "internal"          # internal | confidential | public
---

# 1. Summary（概要）

提案内容を1〜3行で簡潔にまとめます。  
例：  
> 「APIバージョニングをURLからHTTPヘッダ方式へ変更する提案」  
> 「認証を自作ミドルウェアからAuth.jsへ統一する提案」

---

# 2. Motivation（背景・課題）

- 現状の課題や非効率な点を説明します。  
- この提案が必要になった理由、解決すべき根本原因を明記。  

例：
- 現状URLベースのAPIバージョニングが管理困難になっている。  
- バージョン更新時のコード重複やデプロイコストが高い。  
- 新しい仕組みで改善できる見込みがある。

---

# 3. Proposal（提案内容）

- 採用したい方針・技術・運用を詳細に記述します。  
- 図やサンプルコードを使って構造的に示すのが望ましい。

例：
```text
[Client] → [ALB] → [FastAPI Middleware] → [Router (version controlled)]
````

```python
# Middleware sample
version = request.headers.get("Accept-Version", "v1")
router = routers[version]
```

---

# 4. Alternatives（代替案の検討）

| No | 代替案                             | 概要                | 採用しなかった理由         |
| -- | ------------------------------- | ----------------- | ----------------- |
| 1  | URLパス方式 (`/v1/...`)             | 現行方式              | エンドポイント増加による管理コスト |
| 2  | サブドメイン方式 (`v1.api.example.com`) | バージョン切替容易         | ALBルーティング構成が複雑    |
| 3  | ヘッダ方式 (提案案)                     | Accept-Versionで明示 | 実装・テスト容易性が高い      |

---

# 5. Impact（影響範囲）

| 項目            | 影響内容                     | 対応方針        |
| ------------- | ------------------------ | ----------- |
| APIクライアント     | ヘッダ追加対応が必要               | SDK更新で吸収    |
| Gateway / ALB | ルーティング設定変更不要             | -           |
| OpenAPI       | 各operationIdへversionタグ追加 | 自動生成スクリプト修正 |
| Test環境        | 回帰テストの追加                 | QAチーム対応予定   |

---

# 6. Drawbacks / Risks（懸念・リスク）

* ヘッダ方式に慣れていないクライアントが混乱する可能性
* バージョン指定漏れ時のデフォルト挙動の定義が必要
* 一部古いSDKで対応不可の可能性

> これらの懸念に対して、対策を提案内に含めておくこと。

---

# 7. Open Questions（未決事項）

* デフォルトバージョンの決定（例：`v1` or latest）
* APIドキュメント生成時のversionタグ管理方針
* 運用上、複数バージョンをどの期間併存させるか

> この項目が残っている間は `status: review` のまま維持。

---

# 8. Decision Criteria（採択基準）

* チーム合意（過半数 or アーキ責任者承認）
* 影響範囲がドメイン単位を超えない
* 実装コスト < 維持コスト削減見込み

> 採択時は `status: accepted` に変更し、ADRを新規作成。
> 拒否された場合は `status: rejected` に変更し、理由を追記。

---

# 9. Related Documents（関連ドキュメント）

* `adr/adr-xxxx-api-versioning.md` — 採択後に作成されるADR
* `features/<feature>/api/contracts.md` — 対応するAPI仕様
* `guidelines/api-style.md` — API全体設計指針

---

# 10. Lifecycle / Status履歴

| 日付         | 状態         | 変更内容       | 担当         |
| ---------- | ---------- | ---------- | ---------- |
| YYYY-MM-DD | wip        | 初版作成       | @owner     |
| YYYY-MM-DD | review     | チームレビュー開始  | @reviewer1 |
| YYYY-MM-DD | accepted   | 採択、ADR作成済み | @owner     |
| YYYY-MM-DD | superseded | 新RFCに置換    | @owner     |

---

# 11. Notes（メモ・補足）

* RFCの目的は **「議論の記録を残すこと」** にあります。
* 採択後に削除せず、将来の意思決定参照元として残します。
* AIエージェントはRFCの `status` を確認し、未承認案を自動実装に反映しないよう制御します。

---

```

---

### 💡 このテンプレートの設計意図

| セクション | 目的 |
|-------------|------|
| **1〜3章** | 提案の背景と内容を具体化し、議論の起点を明確化 |
| **4〜5章** | 他案比較と影響範囲を整理し、採択判断を容易に |
| **6〜7章** | リスクと未決事項を明示して透明性を確保 |
| **8章** | 採択基準を定義してレビューを形式知化 |
| **9〜10章** | ADRとの連携・履歴管理でトレーサビリティを維持 |
| **11章** | AI実装制御のためのメタ情報として活用可能に |

---

> **運用ポイント：**  
> - RFCは「意思決定前の一時的な場」ではなく、「過程を残す正式ドキュメント」です。  
> - 承認後にADRへ昇格し、RFCには `accepted` を残すことで履歴がリンクされます。  
> - AIにRFCを読み込ませる際は `status` フィールドで判断（`accepted` のみ実装反映）。
```
