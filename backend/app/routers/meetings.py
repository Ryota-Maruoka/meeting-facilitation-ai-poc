"""会議管理エンドポイント"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..schemas.meeting import Meeting, MeetingCreate
from ..storage import DataStore
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings", tags=["meetings"])

# DataStore
store = DataStore(settings.data_dir)


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
        "transcripts",
        "decisions",
        "actions",
        "parking",
        "ended_at",
        "summary",
        "mini_summary",
        "deviation_alerts",
    ]
    for field in extra_fields:
        normalized.pop(field, None)

    # updated_atが無い場合はcreated_atを使用
    if "updated_at" not in normalized and "created_at" in normalized:
        normalized["updated_at"] = normalized["created_at"]

    return normalized


@router.get("", response_model=list[Meeting])
def list_meetings() -> list[Meeting]:
    """会議一覧を取得する。

    Returns:
        会議一覧
    """
    meetings = store.list_meetings()
    return [Meeting(**_normalize_meeting_dict(meeting)) for meeting in meetings]


@router.post("", response_model=Meeting, status_code=201)
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
        "status": "draft",
    }

    try:
        store.save_meeting(meeting_id, meeting_data)
        logger.info("Meeting created successfully: %s", meeting_id)
        return Meeting(**meeting_data)
    except Exception as e:
        logger.error("Failed to create meeting: %s", e)
        raise


@router.get("/{meeting_id}", response_model=Meeting)
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


@router.put("/{meeting_id}", response_model=Meeting)
def update_meeting(meeting_id: str, payload: dict) -> Meeting:
    """会議情報を更新する。

    Args:
        meeting_id: 会議ID
        payload: 更新データ

    Returns:
        更新された会議情報

    Raises:
        HTTPException: 会議が見つからない場合
    """
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
    return Meeting(**_normalize_meeting_dict(meeting))

