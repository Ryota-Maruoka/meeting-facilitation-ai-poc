"""Slack連携エンドポイント"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..schemas.slack import SlackPayload
from ..services.slack import post_to_slack

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/slack", tags=["slack"])


@router.post("/send")
def slack_send(payload: SlackPayload) -> dict:
    """Slackへメッセージを送信する。

    Args:
        payload: Slack送信ペイロード

    Returns:
        送信結果

    Raises:
        HTTPException: 送信失敗
    """
    ok = post_to_slack(payload.webhook_url, payload.text)
    if not ok:
        raise HTTPException(400, "Failed to send to Slack")
    return {"ok": True}

