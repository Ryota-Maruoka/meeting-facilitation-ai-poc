from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime, timedelta
import os
from .storage import DataStore
from .services.llm import generate_mini_summary, extract_unresolved, generate_proposals, render_final_markdown
from .services.deviation import check_deviation
from .services.slack import post_to_slack
from .services.asr import transcribe_audio

app = FastAPI(title="Facilitation AI PoC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.getcwd(), "data"))
store = DataStore(DATA_DIR)

# ----- Models -----
class AgendaItem(BaseModel):
    title: str
    duration_min: int = 10
    expected_outcome: Optional[str] = None
    resource_url: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    purpose: str
    deliverable_template: str
    participants: List[str] = []
    consent_recording: bool = False
    agenda: List[AgendaItem] = []

class Meeting(BaseModel):
    id: str
    created_at: str
    title: str
    purpose: str
    deliverable_template: str
    participants: List[str]
    consent_recording: bool
    agenda: List[AgendaItem]

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
@app.post("/meetings", response_model=Meeting)
def create_meeting(payload: MeetingCreate):
    if not payload.consent_recording:
        # For PoC: allow meeting creation but mark consent false
        pass
    meeting_id = str(uuid4())
    created_at = datetime.utcnow().isoformat()
    meeting = {
        "id": meeting_id,
        "created_at": created_at,
        "title": payload.title,
        "purpose": payload.purpose,
        "deliverable_template": payload.deliverable_template,
        "participants": payload.participants,
        "consent_recording": payload.consent_recording,
        "agenda": [item.model_dump() for item in payload.agenda],
        "transcripts": [],
        "decisions": [],
        "actions": [],
        "parking": []
    }
    store.save_meeting(meeting_id, meeting)
    return Meeting(**meeting)

@app.get("/meetings/{meeting_id}", response_model=Meeting)
def get_meeting(meeting_id: str):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
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

@app.post("/meetings/{meeting_id}/transcribe")
async def transcribe_audio_upload(meeting_id: str, file: UploadFile = File(...)):
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    if not meeting.get("consent_recording", False):
        raise HTTPException(403, "Recording consent not granted for this meeting")
    content = await file.read()
    chunks = transcribe_audio(content)
    meeting.setdefault("transcripts", []).extend(chunks)
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "chunks": len(chunks)}

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
