"""Meeting Facilitation AI PoC - FastAPI Application"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.exceptions import AppError
from .routers import (
    meetings_router,
    transcripts_router,
    summaries_router,
    decisions_router,
    parking_router,
    slack_router,
)
from .settings import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    logger.info("Starting up Facilitation AI PoC API...")
    yield
    logger.info("Shutting down Facilitation AI PoC API...")


app = FastAPI(title="Facilitation AI PoC API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 例外ハンドラ
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """アプリケーション例外ハンドラ"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """汎用例外ハンドラ"""
    logger.error("Unexpected error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
        },
    )


# ルーターの登録
app.include_router(meetings_router)
app.include_router(transcripts_router)
app.include_router(summaries_router)
app.include_router(decisions_router)
app.include_router(parking_router)
app.include_router(slack_router)


@app.get("/health")
def health():
    """ヘルスチェックエンドポイント"""
    return {"ok": True}
