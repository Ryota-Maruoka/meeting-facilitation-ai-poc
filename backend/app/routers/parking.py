"""Parking Lotエンドポイント"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..schemas.parking import ParkingItem
from ..services.ai_deviation import ai_deviation_service
from ..storage import DataStore
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["parking"])

# DataStore
store = DataStore(settings.data_dir)


@router.post("/parking")
async def add_parking(meeting_id: str, item: ParkingItem) -> dict:
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
    
    # parkingフィールドが存在しない場合は初期化
    if "parking" not in meeting:
        meeting["parking"] = []
    
    # タイトルをAIで自動生成（contentから生成）
    if item.content:
        logger.info(f"🔍 タイトルをAIで自動生成します。content: {item.content[:100]}...")
        title = await ai_deviation_service.generate_parking_title(item.content)
        logger.info(f"🤖 AI生成されたtitle: {title}")
        item.title = title
    
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
    
    # parkingフィールドが存在しない場合は空のリストを返す
    return meeting.get("parking", [])

