"""Parking Lotエンドポイント"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..schemas.parking import ParkingItem
from ..storage import DataStore
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["parking"])

# DataStore
store = DataStore(settings.data_dir)


@router.post("/parking")
def add_parking(meeting_id: str, item: ParkingItem) -> dict:
    """Parking Lotアイテムを追加する。

    Args:
        meeting_id: 会議ID
        item: Parking Lotアイテム

    Returns:
        追加結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["parking"].append(item.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["parking"])}


@router.get("/parking")
def list_parking(meeting_id: str) -> list:
    """Parking Lotアイテム一覧を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        Parking Lotアイテム一覧

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("parking", [])

