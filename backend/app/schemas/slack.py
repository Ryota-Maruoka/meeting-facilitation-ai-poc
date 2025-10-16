"""Slack連携関連のスキーマ定義"""
from __future__ import annotations

from pydantic import BaseModel


class SlackPayload(BaseModel):
    """Slack送信ペイロード"""

    webhook_url: str
    text: str

