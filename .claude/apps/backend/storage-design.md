---
title: "データストレージ設計書"
status: "active"
owner: "backend-team"
last_update: "2025-02-11"
confidentiality: "internal"
related:
  - ".claude/apps/backend/overview.md"
  - ".claude/features/meetings/design.md"
---

# データストレージ設計書

## 1. 概要

### 1.1 目的

Meeting Facilitation AI PoCにおけるデータ永続化層の設計仕様を定義します。
現状はJSONファイルベースの軽量ストレージを採用し、将来的なPostgreSQL移行を見据えた設計となっています。

### 1.2 設計方針

- **シンプル性**: PoC段階ではDBサーバー不要のJSONファイルベース
- **データ分離**: 会議ごとにディレクトリを分けて管理
- **後方互換性**: 旧形式のデータも読み込み可能
- **型安全性**: Pydanticスキーマとの連携
- **移行性**: 将来のPostgreSQL移行を考慮したインターフェース設計

---

## 2. ディレクトリ構造

### 2.1 全体構造

```
data/
├── meetings/                   # 会議データルート
│   ├── {meeting_id_1}/        # 会議ごとのディレクトリ
│   │   ├── meeting.json       # 会議メタデータ
│   │   ├── transcripts.json   # 文字起こしデータ
│   │   ├── summary.json       # 要約データ
│   │   └── recording.webm     # 録音ファイル（バイナリ）
│   ├── {meeting_id_2}/
│   │   ├── meeting.json
│   │   ├── transcripts.json
│   │   ├── summary.json
│   │   └── recording.webm
│   └── ...
└── summaries/                  # 要約生成の一時ファイル（レガシー）
```

### 2.2 ファイル命名規則

| ファイル名 | 説明 | フォーマット |
|-----------|------|-------------|
| `meeting.json` | 会議の基本情報・アジェンダ・ステータス | JSON（UTF-8、インデント2） |
| `transcripts.json` | 文字起こしの配列 | JSON（UTF-8、インデント2） |
| `summary.json` | 要約データ（ミニ要約・最終サマリ） | JSON（UTF-8、インデント2） |
| `recording.webm` | 音声録音ファイル | WebMバイナリ |

### 2.3 ディレクトリ作成タイミング

| タイミング | 作成されるディレクトリ |
|----------|---------------------|
| アプリ起動時 | `data/`, `data/meetings/` |
| 会議作成時 | `data/meetings/{meeting_id}/` |
| 音声録音時 | 自動作成（既に存在する場合はスキップ） |

---

## 3. ファイル形式

### 3.1 meeting.json

**会議のメタデータとアジェンダを格納**

```json
{
  "id": "uuid-v4-string",
  "created_at": "2025-02-11T10:30:00.000000+00:00",
  "updated_at": "2025-02-11T10:35:00.000000+00:00",
  "started_at": "2025-02-11T10:35:00.000000+00:00",
  "ended_at": null,
  "title": "週次プロジェクトレビュー",
  "purpose": "今週の進捗確認と課題の洗い出し",
  "deliverable_template": "決定事項・アクション項目・リスク一覧",
  "meetingDate": "2025-02-11",
  "participants": ["田中", "佐藤", "鈴木"],
  "agenda": [
    {
      "title": "先週のアクション確認",
      "duration": 10,
      "expectedOutcome": "全アクション項目の完了確認",
      "relatedUrl": "https://example.com/actions"
    },
    {
      "title": "今週の進捗報告",
      "duration": 20,
      "expectedOutcome": "各メンバーの進捗共有",
      "relatedUrl": null
    }
  ],
  "status": "in_progress"
}
```

**フィールド仕様**:

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `id` | string | ✓ | UUID v4形式の会議ID |
| `created_at` | datetime | ✓ | 作成日時（UTC、ISO 8601形式） |
| `updated_at` | datetime | ✓ | 更新日時（UTC、ISO 8601形式） |
| `started_at` | datetime/null | - | 開始日時（UTC、ISO 8601形式） |
| `ended_at` | datetime/null | - | 終了日時（UTC、ISO 8601形式） |
| `title` | string | ✓ | 会議タイトル（1-200文字） |
| `purpose` | string | ✓ | 会議の目的（1文字以上） |
| `deliverable_template` | string | ✓ | 期待成果テンプレート（1文字以上） |
| `meetingDate` | string/null | - | 会議予定日（YYYY-MM-DD形式） |
| `participants` | array[string] | ✓ | 参加者リスト |
| `agenda` | array[AgendaItem] | ✓ | アジェンダ項目の配列 |
| `status` | enum | ✓ | `"draft"` / `"in_progress"` / `"completed"` |

### 3.2 transcripts.json

**文字起こしデータの配列**

```json
[
  {
    "timestamp": "2025-02-11T10:35:12.000000+00:00",
    "speaker": "田中",
    "text": "それでは会議を始めます。"
  },
  {
    "timestamp": "2025-02-11T10:35:45.000000+00:00",
    "speaker": "佐藤",
    "text": "先週のアクション項目ですが、全て完了しました。"
  }
]
```

**フィールド仕様**:

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `timestamp` | datetime | ✓ | 発言日時（UTC、ISO 8601形式） |
| `speaker` | string | - | 話者名（未対応の場合は空文字列） |
| `text` | string | ✓ | 文字起こしテキスト |

### 3.3 summary.json

**要約データ（ミニ要約と最終サマリ）**

```json
{
  "meeting_id": "uuid-v4-string",
  "updated_at": "2025-02-11T11:00:00.000000+00:00",
  "mini_summaries": [
    {
      "timestamp": "2025-02-11T10:38:00.000000+00:00",
      "decisions": ["先週のアクション全て完了"],
      "pending_items": [],
      "action_items": []
    },
    {
      "timestamp": "2025-02-11T10:41:00.000000+00:00",
      "decisions": ["開発スケジュールを1週間前倒し"],
      "pending_items": ["デザイン案の最終承認"],
      "action_items": ["田中: デザイン資料を明日までに提出"]
    }
  ],
  "final_summary": {
    "summary": "週次レビューで進捗確認。開発スケジュールを前倒しすることを決定。",
    "decisions": [
      "先週のアクション全て完了",
      "開発スケジュールを1週間前倒し"
    ],
    "pending_items": [
      "デザイン案の最終承認"
    ],
    "action_items": [
      {
        "description": "デザイン資料を明日までに提出",
        "assignee": "田中",
        "due_date": "2025-02-12"
      }
    ],
    "generated_at": "2025-02-11T11:05:00.000000+00:00"
  }
}
```

**フィールド仕様**:

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `meeting_id` | string | ✓ | 会議ID |
| `updated_at` | datetime | ✓ | 最終更新日時（UTC） |
| `mini_summaries` | array | - | 3分ごとのミニ要約配列 |
| `final_summary` | object | - | 会議終了時の最終サマリ |

### 3.4 recording.webm

**音声録音ファイル（バイナリ）**

- **フォーマット**: WebM（Opus codec）
- **サンプリングレート**: 16kHz（ASRに最適化）
- **チャネル**: モノラル
- **書き込み方式**: 追記モード（`append_audio_chunk`メソッド）

---

## 4. DataStoreクラスAPI仕様

### 4.1 クラス初期化

```python
from app.storage import DataStore

datastore = DataStore(base_dir="./data")
```

**パラメータ**:
- `base_dir` (str): データディレクトリのルートパス（デフォルト: `./data`）

**初期化時の動作**:
- `base_dir`ディレクトリを作成（存在しない場合）
- `base_dir/meetings/`ディレクトリを作成（存在しない場合）

### 4.2 会議メタデータ操作

#### 4.2.1 save_meeting

**会議メタデータを保存（作成/更新）**

```python
datastore.save_meeting(meeting_id, data)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `data` (dict): 会議データ（Pydanticモデルの`.model_dump()`結果）

**動作**:
1. `data/meetings/{meeting_id}/`ディレクトリを作成（存在しない場合）
2. `meeting.json`にデータを書き込み（上書き）
3. datetimeオブジェクトは自動的にISO 8601形式に変換

**例**:
```python
meeting_data = {
    "id": "abc123",
    "title": "週次レビュー",
    "status": "draft",
    # ... 他のフィールド
}
datastore.save_meeting("abc123", meeting_data)
```

#### 4.2.2 load_meeting

**会議メタデータを読み込み**

```python
meeting = datastore.load_meeting(meeting_id)
```

**戻り値**:
- 成功時: `dict` - 会議データ
- 失敗時: `None` - 会議が存在しない場合

**例**:
```python
meeting = datastore.load_meeting("abc123")
if meeting:
    print(meeting["title"])
else:
    print("会議が見つかりません")
```

#### 4.2.3 list_meetings

**全会議一覧を取得**

```python
meetings = datastore.list_meetings()
```

**戻り値**: `list[dict]` - 会議データの配列（作成日時の降順）

**動作**:
1. `data/meetings/`配下の全ディレクトリをスキャン
2. 各ディレクトリの`meeting.json`を読み込み
3. `created_at`で降順ソート（新しい順）
4. 旧形式（`{meeting_id}.json`）も後方互換性のため読み込み

**例**:
```python
meetings = datastore.list_meetings()
for meeting in meetings:
    print(f"{meeting['title']} - {meeting['status']}")
```

#### 4.2.4 delete_meeting

**会議データを削除（ディレクトリごと削除）**

```python
datastore.delete_meeting(meeting_id)
```

**動作**:
1. `data/meetings/{meeting_id}/`ディレクトリの存在確認
2. ディレクトリごと削除（`shutil.rmtree`）
3. 関連ファイル（transcripts.json, summary.json, recording.webm）も全て削除

**例外**:
- `FileNotFoundError`: 会議が存在しない場合

**例**:
```python
try:
    datastore.delete_meeting("abc123")
    print("会議を削除しました")
except FileNotFoundError:
    print("会議が見つかりません")
```

### 4.3 文字起こしデータ操作

#### 4.3.1 append_transcript

**文字起こしデータを追記**

```python
datastore.append_transcript(meeting_id, transcript)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `transcript` (dict): 文字起こしデータ（`timestamp`, `speaker`, `text`）

**動作**:
1. 既存の`transcripts.json`を読み込み（存在しない場合は空配列）
2. 新しい`transcript`を配列に追加
3. `transcripts.json`に書き込み

**例**:
```python
transcript = {
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "speaker": "田中",
    "text": "プロジェクトの進捗について報告します。"
}
datastore.append_transcript("abc123", transcript)
```

#### 4.3.2 load_transcripts

**文字起こしデータを読み込み**

```python
transcripts = datastore.load_transcripts(meeting_id)
```

**戻り値**: `list[dict]` - 文字起こしデータの配列（存在しない場合は空配列）

**例**:
```python
transcripts = datastore.load_transcripts("abc123")
for t in transcripts:
    print(f"[{t['timestamp']}] {t['speaker']}: {t['text']}")
```

#### 4.3.3 save_transcripts

**文字起こしデータを上書き保存**

```python
datastore.save_transcripts(meeting_id, transcripts)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `transcripts` (list[dict]): 文字起こしデータの配列

**用途**: 一括更新や編集時に使用

### 4.4 要約データ操作

#### 4.4.1 save_summary

**要約データを保存（上書き）**

```python
datastore.save_summary(meeting_id, summary)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `summary` (dict): 要約データ（`mini_summaries`, `final_summary`を含む）

**例**:
```python
summary = {
    "meeting_id": "abc123",
    "updated_at": datetime.now(timezone.utc).isoformat(),
    "mini_summaries": [...],
    "final_summary": {...}
}
datastore.save_summary("abc123", summary)
```

#### 4.4.2 load_summary

**要約データを読み込み**

```python
summary = datastore.load_summary(meeting_id)
```

**戻り値**:
- 成功時: `dict` - 要約データ
- 失敗時: `None` - 要約が存在しない場合

### 4.5 音声録音操作

#### 4.5.1 append_audio_chunk

**音声チャンクを追記**

```python
datastore.append_audio_chunk(meeting_id, audio_data)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `audio_data` (bytes): 音声データ（WebMバイナリ）

**動作**:
1. `recording.webm`に追記モード（`ab`）で書き込み
2. ファイルが存在しない場合は新規作成

**用途**: リアルタイム録音時に音声チャンクを逐次追記

**例**:
```python
# フロントエンドから送信された音声データを保存
datastore.append_audio_chunk("abc123", audio_bytes)
```

#### 4.5.2 get_recording_path

**録音ファイルのパスを取得**

```python
path = datastore.get_recording_path(meeting_id)
```

**戻り値**: `str` - 録音ファイルの絶対パス

**用途**: ダウンロードAPIで録音ファイルを返す際に使用

**例**:
```python
from fastapi.responses import FileResponse

recording_path = datastore.get_recording_path("abc123")
return FileResponse(recording_path, media_type="audio/webm")
```

### 4.6 汎用ファイル操作

#### 4.6.1 save_file

**任意のファイルを会議ディレクトリに保存**

```python
datastore.save_file(meeting_id, filename, content)
```

**パラメータ**:
- `meeting_id` (str): 会議ID
- `filename` (str): ファイル名
- `content` (str): ファイル内容（テキスト）

**用途**: Markdownレポートなどの任意ファイル保存

**例**:
```python
report_md = "# 会議レポート\n\n## 決定事項\n- ..."
datastore.save_file("abc123", "report.md", report_md)
```

---

## 5. データ整合性の保証

### 5.1 トランザクション

**現状**: JSONファイル書き込みは原子的ではない

**対策**:
- ファイル書き込み前に会議ディレクトリが存在することを確認
- 書き込み失敗時は例外をスローし、呼び出し元でエラーハンドリング

**将来（PostgreSQL移行後）**: トランザクション管理で整合性を保証

### 5.2 同時書き込み

**現状の制約**:
- 複数プロセス/スレッドからの同時書き込みは非対応
- ファイルロック機構なし

**推奨運用**:
- PoC段階では単一ユーザー・単一会議進行を想定
- 本番環境ではPostgreSQL移行を推奨

### 5.3 データバックアップ

**推奨手順**:
1. `data/`ディレクトリ全体を定期的にバックアップ
2. S3などのオブジェクトストレージに保存

**バックアップスクリプト例**:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz data/
aws s3 cp backup-*.tar.gz s3://my-bucket/backups/
```

---

## 6. 後方互換性

### 6.1 旧形式のサポート

**旧形式**: `data/meetings/{meeting_id}.json`（単一ファイル）

**新形式**: `data/meetings/{meeting_id}/meeting.json`（ディレクトリベース）

**互換性の保証**:
- `list_meetings()`メソッドは旧形式のファイルも読み込み
- 旧形式のデータは読み取り専用（更新時は新形式に自動移行）

### 6.2 マイグレーション戦略

**旧形式から新形式への移行**:
1. 旧形式の会議データを`load_meeting()`で読み込み
2. `save_meeting()`で新形式に保存
3. 旧形式ファイルは削除（オプション）

**マイグレーションスクリプト例**:
```python
import os
import shutil

datastore = DataStore("./data")
meetings_dir = "./data/meetings"

for filename in os.listdir(meetings_dir):
    if filename.endswith(".json"):
        meeting_id = filename[:-5]
        # 旧形式を読み込み
        old_path = os.path.join(meetings_dir, filename)
        with open(old_path, "r", encoding="utf-8") as f:
            meeting = json.load(f)

        # 新形式で保存
        datastore.save_meeting(meeting_id, meeting)

        # 旧形式ファイルを削除（オプション）
        os.remove(old_path)
```

---

## 7. エラーハンドリング

### 7.1 ファイル読み込みエラー

| エラー | 原因 | 対応 |
|--------|------|------|
| `FileNotFoundError` | 会議データが存在しない | `None`を返す（`load_meeting`, `load_summary`） |
| `json.JSONDecodeError` | JSONフォーマットが不正 | 例外をスロー（呼び出し元でハンドリング） |
| `UnicodeDecodeError` | 文字エンコーディングエラー | 例外をスロー |

### 7.2 ファイル書き込みエラー

| エラー | 原因 | 対応 |
|--------|------|------|
| `PermissionError` | 書き込み権限がない | 例外をスロー |
| `OSError` | ディスク容量不足 | 例外をスロー |

### 7.3 推奨エラーハンドリング

```python
try:
    datastore.save_meeting(meeting_id, meeting_data)
except PermissionError:
    raise HTTPException(status_code=500, detail="Permission denied")
except OSError as e:
    raise HTTPException(status_code=500, detail=f"Storage error: {e}")
```

---

## 8. パフォーマンス考慮事項

### 8.1 ファイルI/O最適化

| 操作 | 推定速度 | 注意点 |
|------|---------|--------|
| `save_meeting()` | < 10ms | SSDの場合 |
| `load_meeting()` | < 5ms | キャッシュ有効時 |
| `list_meetings()` | 100件で < 50ms | ディレクトリスキャンがボトルネック |
| `append_transcript()` | < 15ms | 既存ファイルの読み込み+書き込み |

### 8.2 スケーラビリティ限界

**JSONファイルベースの限界**:
- 会議数: 1,000件程度まで（`list_meetings()`のパフォーマンス低下）
- 同時進行中会議: 10件程度まで（ファイルI/O競合）
- 文字起こしデータ: 会議あたり10,000件まで（メモリ消費）

**1,000件以上の会議を扱う場合はPostgreSQL移行を推奨**

---

## 9. 将来のPostgreSQL移行計画

### 9.1 移行のメリット

- **トランザクション管理**: ACID特性による整合性保証
- **同時書き込み対応**: 複数ユーザー・複数会議の同時進行
- **スケーラビリティ**: 数万件の会議データにも対応
- **検索性能**: インデックスによる高速検索
- **バックアップ**: PostgreSQLの標準バックアップ機能

### 9.2 テーブル設計（案）

#### meetings テーブル

```sql
CREATE TABLE meetings (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    title VARCHAR(200) NOT NULL,
    purpose TEXT NOT NULL,
    deliverable_template TEXT NOT NULL,
    meeting_date DATE,
    participants TEXT[], -- PostgreSQL配列型
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')),
    agenda JSONB NOT NULL -- アジェンダはJSONBで格納
);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
```

#### transcripts テーブル

```sql
CREATE TABLE transcripts (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    speaker VARCHAR(100),
    text TEXT NOT NULL
);

CREATE INDEX idx_transcripts_meeting_id ON transcripts(meeting_id, timestamp);
```

#### summaries テーブル

```sql
CREATE TABLE summaries (
    meeting_id UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    mini_summaries JSONB, -- ミニ要約はJSONB
    final_summary JSONB   -- 最終サマリはJSONB
);
```

### 9.3 DataStoreインターフェースの維持

**移行方針**:
- `DataStore`クラスのインターフェース（メソッドシグネチャ）は変更しない
- 内部実装のみPostgreSQLに切り替え
- 呼び出し元のコード（routers, services）は無変更

**実装例**:
```python
class DataStore:
    def __init__(self, db_connection_string: str):
        self.engine = create_engine(db_connection_string)

    def save_meeting(self, meeting_id: str, data: dict):
        # JSONファイル書き込み → SQL INSERT/UPDATE
        with self.engine.connect() as conn:
            conn.execute(...)

    def load_meeting(self, meeting_id: str) -> Optional[dict]:
        # JSONファイル読み込み → SQL SELECT
        with self.engine.connect() as conn:
            result = conn.execute(...)
            return dict(result.fetchone()) if result else None
```

### 9.4 移行手順

1. **PostgreSQLサーバー構築** (AWS RDS推奨)
2. **テーブル作成** (上記SQL実行)
3. **マイグレーションスクリプト作成** (JSONデータをSQLにインポート)
4. **DataStore実装切り替え** (環境変数で切り替え可能に)
5. **テスト実行** (既存のテストスイートで動作確認)
6. **本番デプロイ** (ダウンタイム最小化)

---

## 10. セキュリティ考慮事項

### 10.1 ファイルアクセス権限

**推奨設定**:
```bash
chmod 700 data/               # オーナーのみアクセス可能
chmod 600 data/meetings/*/*.json  # オーナーのみ読み書き可能
```

### 10.2 パス・トラバーサル対策

**脆弱性**: `meeting_id`に`../`が含まれる場合、親ディレクトリにアクセス可能

**対策**:
```python
import re

def _validate_meeting_id(meeting_id: str):
    # UUIDフォーマットのみ許可
    if not re.match(r'^[a-f0-9\-]{36}$', meeting_id):
        raise ValueError("Invalid meeting_id format")
```

**現状**: Pydanticスキーマで`meeting_id`をバリデーション済み（UUID形式）

### 10.3 ファイルサイズ制限

**録音ファイル**: 最大1GB（会議4時間相当）

**実装**:
```python
MAX_RECORDING_SIZE = 1 * 1024 * 1024 * 1024  # 1GB

def append_audio_chunk(self, meeting_id: str, audio_data: bytes):
    path = self._recording_path(meeting_id)
    if os.path.exists(path) and os.path.getsize(path) + len(audio_data) > MAX_RECORDING_SIZE:
        raise ValueError("Recording file size limit exceeded")
    # ... 追記処理
```

---

## 11. テスト戦略

### 11.1 単体テスト

**テスト対象**:
- `DataStore`クラスの全メソッド
- エラーハンドリング（ファイルが存在しない、書き込み権限がない等）

**テストコード例**:
```python
import pytest
from app.storage import DataStore

def test_save_and_load_meeting(tmp_path):
    datastore = DataStore(base_dir=str(tmp_path))

    meeting_data = {
        "id": "test-123",
        "title": "テスト会議",
        "status": "draft"
    }

    datastore.save_meeting("test-123", meeting_data)
    loaded = datastore.load_meeting("test-123")

    assert loaded["title"] == "テスト会議"
```

### 11.2 統合テスト

**テスト対象**:
- API経由での会議作成→文字起こし追記→要約生成→削除の一連の流れ
- 複数会議の同時進行（ファイル競合の確認）

### 11.3 パフォーマンステスト

**テスト対象**:
- `list_meetings()`の速度（100件/1,000件/10,000件）
- `append_transcript()`の速度（10,000回連続追記）

---

## 関連ドキュメント

- [バックエンド アーキテクチャ概要](./overview.md)
- [会議管理機能 - 処理設計書](../../features/meetings/design.md)
- [会議管理API - API契約書](../../features/meetings/api/contracts.md)
- [環境変数設計書](./environment-design.md)
