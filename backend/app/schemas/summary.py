"""要約・決定・アクション関連のスキーマ定義"""
from __future__ import annotations

from pydantic import BaseModel


class MiniSummary(BaseModel):
    """ミニ要約"""

    decisions: list[str] = []
    unresolved: list[str] = []
    actions: list[str] = []


class Decision(BaseModel):
    """決定事項"""

    content: str
    owner: str | None = None
    reason: str | None = None
    timestamp: str | None = None


class ActionItem(BaseModel):
    """アクション項目"""

    assignee: str
    content: str
    due: str | None = None

