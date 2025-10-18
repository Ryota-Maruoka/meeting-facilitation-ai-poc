"""Parking Lot関連のスキーマ定義"""
from __future__ import annotations

from pydantic import BaseModel


class ParkingItem(BaseModel):
    """Parking Lotアイテム"""

    title: str

