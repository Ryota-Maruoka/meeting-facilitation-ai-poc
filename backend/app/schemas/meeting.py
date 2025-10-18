"""会議関連のスキーマ定義"""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AgendaItem(BaseModel):
    """アジェンダアイテム"""

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
    """会議作成リクエスト"""

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
    )

    title: str = Field(..., min_length=1, max_length=200)
    purpose: str = Field(..., min_length=1)
    deliverable_template: str = Field(..., min_length=1)
    meetingDate: str | None = Field(None, description="会議日程（YYYY-MM-DD形式）")
    participants: list[str] = Field(default_factory=list)
    agenda: list[AgendaItem] = Field(default_factory=list)


class Meeting(BaseModel):
    """会議レスポンス"""

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
    meetingDate: str | None = Field(None, description="会議日程（YYYY-MM-DD形式）")
    participants: list[str]
    agenda: list[AgendaItem]
    status: str = "draft"

