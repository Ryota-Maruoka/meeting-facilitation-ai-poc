"""API Routers"""
from __future__ import annotations

from .meetings import router as meetings_router
from .transcripts import router as transcripts_router
from .summaries import router as summaries_router
from .decisions import router as decisions_router
from .parking import router as parking_router
from .slack import router as slack_router

__all__ = [
    "meetings_router",
    "transcripts_router",
    "summaries_router",
    "decisions_router",
    "parking_router",
    "slack_router",
]

