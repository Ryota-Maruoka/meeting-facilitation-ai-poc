"""Parking Lot関連のスキーマ定義"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class ParkingItem(BaseModel):
    """Parking Lotアイテム"""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    content: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

