"""決定・アクションエンドポイント"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException

from ..schemas.summary import Decision, ActionItem
from ..storage import DataStore
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["decisions"])

# DataStore
store = DataStore(settings.data_dir)


@router.post("/decisions")
def add_decision(meeting_id: str, decision: Decision) -> dict:
    """決定事項を追加する。

    Args:
        meeting_id: 会議ID
        decision: 決定事項

    Returns:
        追加結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    data = decision.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow().isoformat()
    meeting["decisions"].append(data)
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["decisions"])}


@router.get("/decisions")
def list_decisions(meeting_id: str) -> list:
    """決定事項一覧を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        決定事項一覧

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("decisions", [])


@router.post("/actions")
def add_action(meeting_id: str, action: ActionItem) -> dict:
    """アクション項目を追加する。

    Args:
        meeting_id: 会議ID
        action: アクション項目

    Returns:
        追加結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["actions"].append(action.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["actions"])}


@router.get("/actions")
def list_actions(meeting_id: str) -> list:
    """アクション項目一覧を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        アクション項目一覧

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("actions", [])

