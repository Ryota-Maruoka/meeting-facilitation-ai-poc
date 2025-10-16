"""文字起こし関連のスキーマ定義"""
from __future__ import annotations

from pydantic import BaseModel


class TranscriptChunk(BaseModel):
    """文字起こしチャンク"""

    text: str
    start_sec: float
    end_sec: float
    speaker: str | None = None

