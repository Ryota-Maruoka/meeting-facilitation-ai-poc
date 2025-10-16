from __future__ import annotations

import logging
import tempfile
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated, Optional, List
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, Depends, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .storage import DataStore
from .services.llm import generate_mini_summary, extract_unresolved, generate_proposals, render_final_markdown
from .services.deviation import check_deviation
from .services.slack import post_to_slack
from .services.asr import transcribe_audio_file
from .services.deviation import check_realtime_deviation
from .settings import settings
from .core.exceptions import AppError, NotFoundError

logger = logging.getLogger(__name__)

# DataStore
store = DataStore(settings.data_dir)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    logger.info("Starting up Facilitation AI PoC API...")
    yield
    logger.info("Shutting down Facilitation AI PoC API...")

app = FastAPI(
    title="Facilitation AI PoC API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 例外ハンドラ
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url),
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unexpected error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
        }
    )

# ----- Models -----
class AgendaItem(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
    )
    
    title: str = Field(..., min_length=1, max_length=200)
    duration: int = Field(10, ge=1, le=480)  # 1-480分
    expectedOutcome: str | None = None
    relatedUrl: str | None = None

class MeetingCreate(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
    )
    
    title: str = Field(..., min_length=1, max_length=200)
    purpose: str = Field(..., min_length=1)
    deliverable_template: str = Field(..., min_length=1)
    participants: list[str] = Field(default_factory=list)
    consent_recording: bool = False
    agenda: list[AgendaItem] = Field(default_factory=list)

class Meeting(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
    )
    
    id: str
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    title: str
    purpose: str
    deliverable_template: str
    participants: list[str]
    consent_recording: bool
    agenda: list[AgendaItem]
    status: str = "draft"

class TranscriptChunk(BaseModel):
    text: str
    start_sec: float
    end_sec: float
    speaker: Optional[str] = None

class MiniSummary(BaseModel):
    decisions: List[str] = []
    unresolved: List[str] = []
    actions: List[str] = []

class Decision(BaseModel):
    content: str
    owner: Optional[str] = None
    reason: Optional[str] = None
    timestamp: Optional[str] = None

class ActionItem(BaseModel):
    assignee: str
    content: str
    due: Optional[str] = None

class ParkingItem(BaseModel):
    title: str
    add_to_next_agenda: bool = False

class SlackPayload(BaseModel):
    webhook_url: str
    text: str

# ----- Routes -----
def _normalize_meeting_dict(meeting_dict: dict) -> dict:
    """会議データを正規化する。
    
    旧スキーマのキーを新スキーマに変換し、不要なフィールドを除去する。
    
    Args:
        meeting_dict: 生の会議データ
        
    Returns:
        正規化された会議データ
    """
    normalized = meeting_dict.copy()
    
    # 旧キーを新キーに変換（アジェンダアイテム内）
    if "agenda" in normalized and isinstance(normalized["agenda"], list):
        for item in normalized["agenda"]:
            if isinstance(item, dict):
                if "duration_min" in item:
                    item["duration"] = item.pop("duration_min")
                if "expected_outcome" in item:
                    item["expectedOutcome"] = item.pop("expected_outcome")
                if "resource_url" in item:
                    item["relatedUrl"] = item.pop("resource_url")
    
    # 不要なフィールドを除去（Meetingモデルに定義されていないフィールド）
    extra_fields = [
        "transcripts", "decisions", "actions", "parking", 
        "ended_at", "summary", "mini_summary", "deviation_alerts"
    ]
    for field in extra_fields:
        normalized.pop(field, None)
    
    # updated_atが無い場合はcreated_atを使用
    if "updated_at" not in normalized and "created_at" in normalized:
        normalized["updated_at"] = normalized["created_at"]
    
    return normalized

@app.get("/meetings", response_model=list[Meeting])
def list_meetings() -> list[Meeting]:
    """会議一覧を取得する。
    
    Returns:
        会議一覧
    """
    meetings = store.list_meetings()
    return [Meeting(**_normalize_meeting_dict(meeting)) for meeting in meetings]

@app.post("/meetings", response_model=Meeting, status_code=201)
def create_meeting(payload: MeetingCreate) -> Meeting:
    """会議を作成する。
    
    会議情報を受け取り、データストアに保存して作成された会議を返す。
    
    Args:
        payload: 会議作成リクエストデータ
        
    Returns:
        作成された会議情報
        
    Raises:
        ValidationError: ビジネスルール違反（参加者数上限等）
        InfrastructureError: データストアエラー
    """
    if not payload.consent_recording:
        # For PoC: allow meeting creation but mark consent false
        logger.warning("Meeting created without recording consent")
    
    meeting_id = str(uuid4())
    now = datetime.now(timezone.utc)
    
    meeting_data = {
        "id": meeting_id,
        "created_at": now,
        "updated_at": now,
        "title": payload.title,
        "purpose": payload.purpose,
        "deliverable_template": payload.deliverable_template,
        "participants": payload.participants,
        "consent_recording": payload.consent_recording,
        "agenda": [item.model_dump() for item in payload.agenda],
        "status": "draft"
    }
    
    try:
        store.save_meeting(meeting_id, meeting_data)
        logger.info("Meeting created successfully: %s", meeting_id)
        return Meeting(**meeting_data)
    except Exception as e:
        logger.error("Failed to create meeting: %s", e)
        raise

@app.get("/meetings/{meeting_id}", response_model=Meeting)
def get_meeting(meeting_id: str) -> Meeting:
    """会議詳細を取得する。
    
    Args:
        meeting_id: 会議ID
        
    Returns:
        会議詳細情報
        
    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return Meeting(**_normalize_meeting_dict(meeting))

@app.put("/meetings/{meeting_id}", response_model=Meeting)
def update_meeting(meeting_id: str, payload: dict):
    """会議情報を更新"""
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    
    # 更新可能なフィールドを更新
    if "status" in payload:
        meeting["status"] = payload["status"]
    if "ended_at" in payload:
        meeting["ended_at"] = payload["ended_at"]
    if "summary" in payload:
        meeting["summary"] = payload["summary"]
    if "title" in payload:
        meeting["title"] = payload["title"]
    if "purpose" in payload:
        meeting["purpose"] = payload["purpose"]
    if "deliverable_template" in payload:
        meeting["deliverable_template"] = payload["deliverable_template"]
    if "participants" in payload:
        meeting["participants"] = payload["participants"]
    if "consent_recording" in payload:
        meeting["consent_recording"] = payload["consent_recording"]
    if "agenda" in payload:
        meeting["agenda"] = payload["agenda"]
    
    # 更新日時を設定
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # 保存
    store.save_meeting(meeting_id, meeting)
    return Meeting(**meeting)

@app.post("/meetings/{meeting_id}/transcripts")
def add_transcript(meeting_id: str, chunk: TranscriptChunk):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["transcripts"].append(chunk.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["transcripts"]) }

@app.get("/meetings/{meeting_id}/transcripts")
def list_transcripts(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("transcripts", [])

@app.post("/meetings/{meeting_id}/deviation/check")
def check_meeting_deviation(meeting_id: str):
    """会議の脱線検知を実行する。
    
    Args:
        meeting_id: 会議ID
        
    Returns:
        脱線検知結果
        
    Raises:
        HTTPException: 会議が見つからない場合
    """
    try:
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            raise HTTPException(404, "Meeting not found")
        
        # アジェンダタイトルを取得
        agenda_titles = []
        if "agenda" in meeting and meeting["agenda"]:
            agenda_titles = [item.get("title", "") for item in meeting["agenda"] if item.get("title")]
        
        if not agenda_titles:
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "message": "アジェンダが設定されていません",
                "suggested_agenda": []
            }
        
        # 直近の文字起こし結果を取得
        transcripts = meeting.get("transcripts", [])
        if not transcripts:
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "message": "文字起こしデータがありません",
                "suggested_agenda": []
            }
        
        # 脱線検知を実行
        deviation_result = check_realtime_deviation(
            recent_transcripts=transcripts,
            agenda_titles=agenda_titles,
            threshold=0.3,
            consecutive_chunks=3
        )
        
        logger.info(f"脱線検知完了 for meeting {meeting_id}: {deviation_result}")
        return deviation_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"脱線検知エラー for meeting {meeting_id}: {e}", exc_info=True)
        raise HTTPException(500, f"脱線検知に失敗しました: {str(e)}")

@app.post("/meetings/{meeting_id}/transcribe")
async def transcribe_audio_upload(meeting_id: str, file: UploadFile = File(...)):
    """会議音声を文字起こしする。
    
    Args:
        meeting_id: 会議ID
        file: アップロードされた音声ファイル
        
    Returns:
        文字起こし結果
        
    Raises:
        HTTPException: 会議が見つからない場合、音声処理エラー
    """
    try:
        logger.info(f"Received transcription request for meeting {meeting_id}")
        
        # 会議の存在確認
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            logger.error(f"Meeting not found: {meeting_id}")
            raise HTTPException(404, "Meeting not found")
        
        # 録音同意の確認
        if not meeting.get("consent_recording", False):
            logger.error(f"Recording consent not granted for meeting {meeting_id}")
            raise HTTPException(403, "Recording consent not granted for this meeting")
        
        # ファイルの詳細ログ
        logger.info(f"Audio file: {file.filename}, content_type: {file.content_type}, size: {file.size}")
        
        # ファイルサイズのバリデーション
        if file.size and file.size < 1000:  # 1KB未満は無効
            logger.error(f"Audio file too small: {file.size} bytes")
            raise HTTPException(400, "音声ファイルが小さすぎます")
        
        if file.size and file.size > 50 * 1024 * 1024:  # 50MB制限
            logger.error(f"Audio file too large: {file.size} bytes")
            raise HTTPException(400, "音声ファイルが大きすぎます（50MB以下）")
        
        # 音声ファイルの内容を読み込み
        content = await file.read()
        logger.info(f"Audio file content size: {len(content)} bytes")
        
        # 一時ファイルに保存
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # 音声文字起こし実行
            result = await transcribe_audio_file(temp_file_path)
            logger.info(f"Transcription completed: {result}")
            
            # 文字起こし結果を会議データに保存
            if "transcripts" not in meeting:
                meeting["transcripts"] = []
            
            # 文字起こし結果にIDとタイムスタンプを追加
            transcript_entry = {
                "id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "text": result.get("text", ""),
                "confidence": result.get("confidence", 0.0),
                "language": result.get("language", "ja"),
            }
            
            meeting["transcripts"].append(transcript_entry)
            meeting["updated_at"] = datetime.now(timezone.utc)
            
            # 会議データを保存
            store.save_meeting(meeting_id, meeting)
            
            logger.info(f"Transcription completed successfully for meeting {meeting_id}")
            return transcript_entry
            
        finally:
            # 一時ファイルを削除
            import os
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except HTTPException:
        # HTTPExceptionはそのまま再発生
        raise
    except Exception as e:
        logger.error(f"Transcription failed for meeting {meeting_id}: {e}", exc_info=True)
        raise HTTPException(500, f"Transcription failed: {str(e)}")

@app.post("/meetings/{meeting_id}/summaries/generate", response_model=MiniSummary)
def generate_summary(meeting_id: str, window_min: int = 3):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    now_end = max([t.get("end_sec", 0) for t in meeting.get("transcripts", [])] + [0])
    window_start = max(0, now_end - window_min * 60)
    recent_texts = [t["text"] for t in meeting.get("transcripts", []) if t.get("start_sec",0) >= window_start]
    text = "\n".join(recent_texts)
    summary = generate_mini_summary(text)
    # Persist last summary snapshot (optional)
    meeting["last_summary"] = summary
    store.save_meeting(meeting_id, meeting)
    return summary

@app.post("/meetings/{meeting_id}/unresolved/extract")
def api_extract_unresolved(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    text = "\n".join(t["text"] for t in meeting.get("transcripts", []))
    return {"unresolved": extract_unresolved(text)}

@app.post("/meetings/{meeting_id}/proposals/generate")
def api_generate_proposals(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    unresolved = meeting.get("last_summary", {}).get("unresolved", [])
    return {"proposals": generate_proposals(unresolved)}

@app.post("/meetings/{meeting_id}/deviation/check")
def api_deviation_check(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    agenda_titles = [a.get("title", "") for a in meeting.get("agenda", [])]
    recent_texts = [t["text"] for t in meeting.get("transcripts", [])][-3:]
    score, label, targets = check_deviation("\n".join(recent_texts), agenda_titles)
    return {"score": score, "label": label, "targets": targets}

@app.post("/meetings/{meeting_id}/parking")
def add_parking(meeting_id: str, item: ParkingItem):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["parking"].append(item.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["parking"]) }

@app.get("/meetings/{meeting_id}/parking")
def list_parking(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("parking", [])

@app.post("/meetings/{meeting_id}/decisions")
def add_decision(meeting_id: str, decision: Decision):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    data = decision.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow().isoformat()
    meeting["decisions"].append(data)
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["decisions"]) }

@app.get("/meetings/{meeting_id}/decisions")
def list_decisions(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("decisions", [])

@app.post("/meetings/{meeting_id}/actions")
def add_action(meeting_id: str, action: ActionItem):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["actions"].append(action.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["actions"]) }

@app.get("/meetings/{meeting_id}/actions")
def list_actions(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("actions", [])


@app.post("/slack/send")
def slack_send(payload: SlackPayload):
    ok = post_to_slack(payload.webhook_url, payload.text)
    if not ok:
        raise HTTPException(400, "Failed to send to Slack")
    return {"ok": True}

@app.post("/meetings/{meeting_id}/summary/final")
def final_summary(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    md, slack_text = render_final_markdown(meeting)
    # Persist for download/export
    store.save_file(meeting_id, "summary.md", md)
    return {"markdown": md, "slack_text": slack_text}

@app.get("/health")
def health():
    return {"ok": True}
