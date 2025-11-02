---
title: "会議管理機能 - 処理設計書"
status: "active"
owner: "engineering-team"
last_update: "2025-02-11"
confidentiality: "internal"
related:
  - "./spec.md"
  - "./api/contracts.md"
  - "../../apps/backend/overview.md"
  - "../../apps/frontend/overview.md"
---

# 会議管理機能 - 処理設計書

## 1. 概要

会議管理機能の処理フロー、データフロー、実装詳細を定義します。
バックエンド（FastAPI）とフロントエンド（Next.js）の実装に基づいた設計内容です。

---

## 2. 処理フロー

### 2.1 会議作成フロー

```
[ユーザー操作]
    ↓
フロントエンド: 会議作成画面表示 (/meetings/new)
    ↓
フロントエンド: フォーム入力
    ↓
フロントエンド: バリデーション（クライアント側）
    ↓
フロントエンド: POST /meetings (apiClient.createMeeting)
    ↓
バックエンド: リクエスト受信（meetings.py::create_meeting）
    ↓
バックエンド: Pydanticバリデーション（MeetingCreate）
    ↓
バックエンド: UUID生成（または指定IDを使用）
    ↓
バックエンド: 会議データ構築
    - id: UUID
    - created_at: datetime.now(timezone.utc)
    - updated_at: datetime.now(timezone.utc)
    - status: "draft"
    ↓
バックエンド: データ保存（storage.py::save_meeting）
    - data/meetings/{meeting_id}/meeting.json
    - data/meetings/{meeting_id}/transcripts.json (空配列)
    - data/meetings/{meeting_id}/summary.json (初期値)
    ↓
バックエンド: レスポンス返却（Meeting）
    ↓
フロントエンド: 成功通知（Toast）
    ↓
フロントエンド: 会議進行中画面へリダイレクト (/meetings/{id}/active)
```

### 2.2 会議開始フロー

```
[ユーザー操作: 会議開始ボタンクリック]
    ↓
フロントエンド: POST /meetings/{id}/start (apiClient.startMeeting)
    ↓
バックエンド: リクエスト受信（meetings.py::start_meeting）
    ↓
バックエンド: 会議データ読み込み（storage.py::load_meeting）
    ↓
バックエンド: 会議ステータス更新
    - started_at: datetime.now(timezone.utc)
    - status: "in_progress"
    - updated_at: datetime.now(timezone.utc)
    ↓
バックエンド: データ保存（storage.py::save_meeting）
    ↓
バックエンド: スケジューラー起動（meeting_scheduler.py）
    - 3分ごとのミニ要約生成タスク開始
    ↓
バックエンド: レスポンス返却（Meeting）
    ↓
フロントエンド: 会議状態を"in_progress"に更新
    ↓
フロントエンド: 音声録音UI有効化
    ↓
フロントエンド: 脱線検知タイマー開始（10秒間隔）
```

### 2.3 会議進行中フロー

```
[音声録音・文字起こし]
    ↓
フロントエンド: 音声録音（Web Audio API）
    ↓
フロントエンド: 音声データをBlobとして保存
    ↓
フロントエンド: POST /meetings/{id}/transcribe (apiClient.transcribeAudio)
    - FormData: audioFile
    ↓
バックエンド: リクエスト受信（transcripts.py::transcribe_audio）
    ↓
バックエンド: 音声認識処理（asr_service.py）
    - Azure OpenAI Whisper API呼び出し
    - または Whisper.cpp（ローカル）
    ↓
バックエンド: 文字起こし結果をtranscripts.jsonに追加
    ↓
バックエンド: レスポンス返却（Transcript）
    ↓
フロントエンド: リアルタイム表示エリアに追加

[脱線検知]
    ↓
フロントエンド: 10秒間隔でPOST /meetings/{id}/deviation/check
    ↓
バックエンド: リクエスト受信（summaries.py::check_deviation）
    ↓
バックエンド: 最新の文字起こしテキスト取得
    ↓
バックエンド: アジェンダとの類似度計算（LLMベース）
    ↓
バックエンド: 脱線判定（閾値未満の場合）
    ↓
バックエンド: レスポンス返却（DeviationAlert）
    ↓
フロントエンド: アラート表示
    - 脱線メッセージ
    - 推奨アジェンダ
    - アクションボタン（軌道修正/Parking Lot/無視）

[ミニ要約生成（3分ごと・自動）]
    ↓
バックエンド: スケジューラータスク実行（meeting_scheduler.py）
    ↓
バックエンド: 最新の文字起こしテキスト取得
    ↓
バックエンド: LLM要約生成（llm.py）
    - 決定事項抽出
    - 未決事項抽出
    - アクション項目抽出
    ↓
バックエンド: summary.jsonを更新
    ↓
フロントエンド: 定期ポーリング（またはWebSocket）で要約取得
    ↓
フロントエンド: ミニ要約表示エリアを更新
```

### 2.4 会議終了フロー

```
[ユーザー操作: 会議終了ボタンクリック]
    ↓
フロントエンド: POST /meetings/{id}/end (apiClient.endMeeting)
    ↓
バックエンド: リクエスト受信（meetings.py::end_meeting）
    ↓
バックエンド: スケジューラー停止（meeting_scheduler.py）
    ↓
バックエンド: 会議ステータス更新
    - ended_at: datetime.now(timezone.utc)
    - status: "completed"
    - updated_at: datetime.now(timezone.utc)
    ↓
バックエンド: データ保存（storage.py::save_meeting）
    ↓
バックエンド: 最終要約生成タスクをバックグラウンドで起動
    - BackgroundTasks.add_task(_generate_final_summary_background)
    ↓
バックエンド: レスポンス返却（Meeting）
    ↓
フロントエンド: 会議レポート画面へリダイレクト (/meetings/{id}/summary)

[最終要約生成（バックグラウンド）]
    ↓
バックエンド: 全文字起こしテキスト結合
    ↓
バックエンド: meeting_summarizer.service::summarize_meeting実行
    - 長文対応（チャンク分割・統合）
    - Azure OpenAI Responses API使用
    ↓
バックエンド: 要約結果をsummary.jsonに保存
    - summary: 会議全体の要約
    - decisions: 決定事項一覧
    - undecided: 未決事項一覧
    - actions: アクション項目一覧（担当者・期限付き）
    ↓
フロントエンド: 会議レポート画面で最終要約表示
```

---

## 3. データフロー

### 3.1 会議データの永続化

```
FastAPI (meetings.py)
    ↓
storage.py::DataStore
    ↓
data/meetings/{meeting_id}/
    ├── meeting.json       # 会議基本情報
    ├── transcripts.json   # 文字起こしデータ
    └── summary.json       # 要約・決定事項・アクション
```

**meeting.json構造**:
```json
{
  "id": "uuid",
  "created_at": "2025-02-11T10:00:00Z",
  "updated_at": "2025-02-11T10:00:00Z",
  "started_at": "2025-02-11T10:05:00Z",
  "ended_at": "2025-02-11T11:00:00Z",
  "title": "会議タイトル",
  "purpose": "会議目的",
  "deliverable_template": "期待成果",
  "meetingDate": "2025-02-11",
  "participants": ["太郎", "花子"],
  "agenda": [
    {
      "title": "議題1",
      "duration": 15,
      "expectedOutcome": "期待成果",
      "relatedUrl": null
    }
  ],
  "status": "completed"
}
```

**transcripts.json構造**:
```json
[
  {
    "text": "文字起こしテキスト",
    "timestamp": "2025-02-11T10:05:00Z",
    "speaker": null,
    "confidence": 0.95
  }
]
```

**summary.json構造**:
```json
{
  "generated_at": "2025-02-11T11:00:00Z",
  "summary": "会議全体の要約",
  "decisions": ["決定事項1", "決定事項2"],
  "undecided": ["未決事項1"],
  "actions": [
    {
      "title": "タスク名",
      "owner": "担当者",
      "due": "2025-02-18"
    }
  ]
}
```

### 3.2 型マッピング（Backend ↔ Frontend）

**Backend → Frontend**:
```typescript
// バックエンドレスポンス（snake_case + camelCase混在）
{
  id: string,
  createdAt: string,  // または created_at
  updatedAt: string,  // または updated_at
  deliverable_template: string,
  ...
}

↓ mapBackendMeetingToFrontend ↓

// フロントエンド型（camelCase統一）
{
  id: string,
  created_at: string,
  updated_at: string,
  expectedOutcome: string,  // deliverable_template → expectedOutcome
  ...
}
```

**Frontend → Backend**:
```typescript
// フロントエンド型
{
  title: string,
  purpose: string,
  expectedOutcome: string,
  ...
}

↓ mapFrontendCreateToBackend ↓

// バックエンドリクエスト
{
  title: string,
  purpose: string,
  deliverable_template: string,  // expectedOutcome → deliverable_template
  ...
}
```

---

## 4. 状態遷移

### 4.1 会議ステータス遷移

```
┌─────────┐
│  draft  │ 初期状態（会議作成時）
└────┬────┘
     │ POST /meetings/{id}/start
     ↓
┌──────────────┐
│ in_progress  │ 会議進行中
└──────┬───────┘
       │ POST /meetings/{id}/end
       ↓
   ┌───────────┐
   │ completed │ 会議完了
   └───────────┘
```

**ステータス別の許可操作**:

| ステータス | 許可操作 |
|-----------|---------|
| draft | 編集、削除、開始 |
| in_progress | 終了、文字起こし追加、脱線検知 |
| completed | 閲覧のみ（編集・削除不可） |

### 4.2 フロントエンド状態管理

**useMeeting hook**:
```typescript
const [meeting, setMeeting] = useState<Meeting | null>(null);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// 会議開始
const startMeeting = async () => {
  setLoading(true);
  try {
    const updated = await apiClient.startMeeting(meetingId);
    setMeeting(updated);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 5. バックエンド実装詳細

### 5.1 ルーター実装（meetings.py）

**ファイル**: `backend/app/routers/meetings.py`

**主要関数**:

```python
@router.post("", response_model=Meeting, status_code=201)
def create_meeting(payload: dict) -> Meeting:
    """会議を作成する"""
    meeting_id = payload.get("id", str(uuid4()))
    now = datetime.now(timezone.utc)

    meeting_create = MeetingCreate(
        title=payload["title"],
        purpose=payload["purpose"],
        deliverable_template=payload["deliverable_template"],
        meetingDate=payload.get("meetingDate"),
        participants=payload.get("participants", []),
        agenda=payload.get("agenda", [])
    )

    meeting_data = {
        "id": meeting_id,
        "created_at": now,
        "updated_at": now,
        "title": meeting_create.title,
        "purpose": meeting_create.purpose,
        "deliverable_template": meeting_create.deliverable_template,
        "meetingDate": meeting_create.meetingDate,
        "participants": meeting_create.participants,
        "agenda": [item.model_dump() for item in meeting_create.agenda],
        "status": "draft",
    }

    store.save_meeting(meeting_id, meeting_data)
    store.save_transcripts(meeting_id, [])
    store.save_summary(meeting_id, {
        "generated_at": None,
        "summary": "",
        "decisions": [],
        "undecided": [],
        "actions": []
    })

    return Meeting(**meeting_data)
```

**会議開始処理**:
```python
@router.post("/{meeting_id}/start", response_model=Meeting)
async def start_meeting(meeting_id: str) -> Meeting:
    """会議を開始する"""
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 会議開始時刻を記録
    meeting["started_at"] = datetime.now(timezone.utc).isoformat()
    meeting["status"] = "in_progress"
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()

    store.save_meeting(meeting_id, meeting)

    # 3分ごとの要約生成スケジューラーを開始
    scheduler = get_scheduler()
    await scheduler.start_meeting_scheduler(meeting_id)

    return Meeting(**_normalize_meeting_dict(meeting))
```

**会議終了処理**:
```python
@router.post("/{meeting_id}/end", response_model=Meeting)
async def end_meeting(meeting_id: str, background_tasks: BackgroundTasks) -> Meeting:
    """会議を終了する"""
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # スケジューラーを停止
    scheduler = get_scheduler()
    scheduler.stop_meeting_scheduler(meeting_id)

    # 会議終了時刻を記録
    meeting["ended_at"] = datetime.now(timezone.utc).isoformat()
    meeting["status"] = "completed"
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()

    store.save_meeting(meeting_id, meeting)

    # 最終要約をバックグラウンドで生成
    background_tasks.add_task(_generate_final_summary_background, meeting_id)

    return Meeting(**_normalize_meeting_dict(meeting))
```

### 5.2 データストア実装（storage.py）

**ファイル**: `backend/app/storage.py`

**主要メソッド**:

```python
class DataStore:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.meetings_dir = self.data_dir / "meetings"
        self.meetings_dir.mkdir(parents=True, exist_ok=True)

    def save_meeting(self, meeting_id: str, data: dict) -> None:
        """会議データを保存"""
        meeting_dir = self.meetings_dir / meeting_id
        meeting_dir.mkdir(parents=True, exist_ok=True)

        file_path = meeting_dir / "meeting.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    def load_meeting(self, meeting_id: str) -> dict | None:
        """会議データを読み込み"""
        file_path = self.meetings_dir / meeting_id / "meeting.json"
        if not file_path.exists():
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_meetings(self) -> list[dict]:
        """会議一覧を取得"""
        meetings = []
        for meeting_dir in self.meetings_dir.iterdir():
            if meeting_dir.is_dir():
                meeting = self.load_meeting(meeting_dir.name)
                if meeting:
                    meetings.append(meeting)

        # 更新日時でソート（新しい順）
        return sorted(meetings, key=lambda x: x.get("updated_at", ""), reverse=True)

    def delete_meeting(self, meeting_id: str) -> None:
        """会議データを削除"""
        meeting_dir = self.meetings_dir / meeting_id
        if meeting_dir.exists():
            shutil.rmtree(meeting_dir)
```

### 5.3 スケジューラー実装（meeting_scheduler.py）

**ファイル**: `backend/app/services/meeting_scheduler.py`

**機能**:
- 会議進行中に3分ごとのミニ要約生成タスクを実行
- `asyncio.create_task`でバックグラウンド実行

**実装例**:
```python
class MeetingScheduler:
    def __init__(self):
        self.tasks: dict[str, asyncio.Task] = {}

    async def start_meeting_scheduler(self, meeting_id: str):
        """会議スケジューラーを開始"""
        task = asyncio.create_task(self._run_scheduler(meeting_id))
        self.tasks[meeting_id] = task

    def stop_meeting_scheduler(self, meeting_id: str):
        """会議スケジューラーを停止"""
        if meeting_id in self.tasks:
            self.tasks[meeting_id].cancel()
            del self.tasks[meeting_id]

    async def _run_scheduler(self, meeting_id: str):
        """スケジューラー実行（3分ごと）"""
        while True:
            await asyncio.sleep(180)  # 3分
            try:
                # ミニ要約生成処理
                await self._generate_mini_summary(meeting_id)
            except Exception as e:
                logger.error(f"Mini summary generation failed: {e}")
```

---

## 6. フロントエンド実装詳細

### 6.1 APIクライアント（lib/api.ts）

**ファイル**: `frontend/src/lib/api.ts`

**主要メソッド**:

```typescript
class ApiClient {
  private baseUrl: string;

  async createMeeting(data: MeetingCreate): Promise<Meeting> {
    const payload = this.mapFrontendCreateToBackend(data);
    const created = await this.request<Record<string, unknown>>(`/meetings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapBackendMeetingToFrontend(created);
  }

  async startMeeting(meetingId: string): Promise<Meeting> {
    const data = await this.request<Record<string, unknown>>(
      `/meetings/${meetingId}/start`,
      { method: "POST" }
    );
    return this.mapBackendMeetingToFrontend(data);
  }

  async endMeeting(meetingId: string): Promise<Meeting> {
    const data = await this.request<Record<string, unknown>>(
      `/meetings/${meetingId}/end`,
      { method: "POST" }
    );
    return this.mapBackendMeetingToFrontend(data);
  }
}
```

### 6.2 カスタムHook（hooks/useMeeting.ts）

**ファイル**: `frontend/src/hooks/useMeeting.ts`

**実装**:

```typescript
export function useMeeting(meetingId: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 会議詳細取得
  const fetchMeeting = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMeeting(meetingId);
      setMeeting(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meeting');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  // 会議開始
  const startMeeting = useCallback(async () => {
    try {
      const updated = await apiClient.startMeeting(meetingId);
      setMeeting(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start meeting');
      throw err;
    }
  }, [meetingId]);

  // 会議終了
  const endMeeting = useCallback(async () => {
    try {
      const updated = await apiClient.endMeeting(meetingId);
      setMeeting(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end meeting');
      throw err;
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  return {
    meeting,
    loading,
    error,
    startMeeting,
    endMeeting,
    refetch: fetchMeeting,
  };
}
```

### 6.3 会議進行中画面（app/meetings/[id]/active/page.tsx）

**主要機能**:
- リアルタイム文字起こし表示
- 脱線検知アラート
- ミニ要約表示
- 会議終了ボタン

**実装例**:
```typescript
export default function MeetingActivePage({ params }: { params: { id: string } }) {
  const { meeting, startMeeting, endMeeting } = useMeeting(params.id);
  const { alert, checkDeviation, clearAlert } = useDeviationDetection(params.id, true);
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = async () => {
    // Web Audio API で音声録音開始
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    setIsRecording(true);

    // 録音停止時に文字起こしAPI呼び出し
    mediaRecorder.ondataavailable = async (event) => {
      const audioBlob = event.data;
      await apiClient.transcribeAudio(params.id, audioBlob);
    };
  };

  const handleEndMeeting = async () => {
    await endMeeting();
    router.push(`/meetings/${params.id}/summary`);
  };

  return (
    <div>
      <LiveTranscriptArea meetingId={params.id} />
      {alert && <DeviationAlert alert={alert} onClear={clearAlert} />}
      <MiniSummaryDisplay meetingId={params.id} />
      <button onClick={handleEndMeeting}>会議終了</button>
    </div>
  );
}
```

---

## 7. エラーハンドリング

### 7.1 バックエンドエラー

**カスタム例外**:
```python
class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
```

**グローバル例外ハンドラー**:
```python
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url),
        },
    )
```

### 7.2 フロントエンドエラー

**APIエラーハンドリング**:
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error("API request failed:", error);
  throw error;
}
```

**UIエラー表示**:
```typescript
try {
  await apiClient.createMeeting(data);
  showToast("会議を作成しました", "success");
} catch (error) {
  showToast("会議の作成に失敗しました", "error");
}
```

---

## 8. パフォーマンス考慮事項

### 8.1 バックエンド

- **非同期処理**: FastAPI + async/await
- **バックグラウンドタスク**: 最終要約生成（会議終了時）
- **ファイルI/O最適化**: JSONファイルの読み書きをキャッシュ（将来）

### 8.2 フロントエンド

- **初回コンパイル時間**: Material-UI使用時に1分程度（キャッシュ活用で改善）
- **バンドルサイズ**: 動的インポート（`next/dynamic`）で最適化
- **リアルタイム更新**: ポーリング（10秒間隔）→将来的にWebSocket検討

---

## 9. セキュリティ考慮事項

### 9.1 現状（PoC段階）

- CORS制限（許可オリジンのみ）
- 入力バリデーション（Pydantic）
- 環境変数管理（`.env`ファイル）

### 9.2 将来的な改善

- 認証・認可（Cognito統合）
- 会議へのアクセス制御（作成者・参加者のみ）
- データ暗号化（保存時・転送時）
- CSRF対策（Double-Submit Cookie）

---

## 10. テスト戦略

### 10.1 単体テスト

**バックエンド**:
```python
# pytest
def test_create_meeting():
    payload = {
        "title": "Test Meeting",
        "purpose": "Test Purpose",
        "deliverable_template": "Test Outcome"
    }
    response = client.post("/meetings", json=payload)
    assert response.status_code == 201
    assert response.json()["title"] == "Test Meeting"
```

**フロントエンド**:
```typescript
// Jest + React Testing Library
describe('useMeeting', () => {
  it('should fetch meeting on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMeeting('test-id'));
    await waitForNextUpdate();
    expect(result.current.meeting).toBeDefined();
  });
});
```

### 10.2 E2Eテスト

**Playwright**:
```typescript
test('会議作成から終了までのフロー', async ({ page }) => {
  // 会議作成
  await page.goto('/meetings/new');
  await page.fill('[name="title"]', 'Test Meeting');
  await page.click('button[type="submit"]');

  // 会議開始
  await page.click('button:has-text("会議開始")');

  // 会議終了
  await page.click('button:has-text("会議終了")');

  // サマリ確認
  await expect(page.locator('h1')).toContainText('会議レポート');
});
```

---

## 関連ドキュメント

- [会議管理機能 - 要件定義書](./spec.md)
- [会議管理API - API契約書](./api/contracts.md)
- [バックエンド アーキテクチャ概要](../../apps/backend/overview.md)
- [フロントエンド アーキテクチャ概要](../../apps/frontend/overview.md)
