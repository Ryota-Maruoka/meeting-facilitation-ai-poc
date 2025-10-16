"""文字起こしエンドポイント"""
from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile, File

from ..schemas.transcript import TranscriptChunk
from ..storage import DataStore
from ..services.asr import transcribe_audio_file
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["transcripts"])

# DataStore
store = DataStore(settings.data_dir)


@router.post("/transcripts")
def add_transcript(meeting_id: str, chunk: TranscriptChunk) -> dict:
    """文字起こしチャンクを追加する。

    Args:
        meeting_id: 会議ID
        chunk: 文字起こしチャンク

    Returns:
        追加結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    meeting["transcripts"].append(chunk.model_dump())
    store.save_meeting(meeting_id, meeting)
    return {"ok": True, "count": len(meeting["transcripts"])}


@router.get("/transcripts")
def list_transcripts(meeting_id: str) -> list:
    """文字起こし一覧を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        文字起こし一覧

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting.get("transcripts", [])


@router.post("/transcribe")
async def transcribe_audio_upload(
    meeting_id: str, file: UploadFile = File(...)
) -> dict:
    """会議音声を文字起こしする。

    Args:
        meeting_id: 会議ID
        file: アップロードされた音声ファイル

    Returns:
        文字起こし結果

    Raises:
        HTTPException: 会議が見つからない場合、音声処理エラー
    """
    try:
        logger.info("Received transcription request for meeting %s", meeting_id)

        # 会議の存在確認
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            logger.error("Meeting not found: %s", meeting_id)
            raise HTTPException(404, "Meeting not found")

        # 録音同意の確認（一時的に無効化）
        # if not meeting.get("consent_recording", False):
        #     logger.error("Recording consent not granted for meeting %s", meeting_id)
        #     raise HTTPException(403, "Recording consent not granted for this meeting")

        # ファイルの詳細ログ
        logger.info(
            "Audio file: %s, content_type: %s, size: %s",
            file.filename,
            file.content_type,
            file.size,
        )

        # ファイルサイズのバリデーション
        if file.size and file.size < 1000:  # 1KB未満は無効
            logger.error("Audio file too small: %s bytes", file.size)
            raise HTTPException(400, "音声ファイルが小さすぎます")

        if file.size and file.size > 50 * 1024 * 1024:  # 50MB制限
            logger.error("Audio file too large: %s bytes", file.size)
            raise HTTPException(400, "音声ファイルが大きすぎます（50MB以下）")

        # 音声ファイルの内容を読み込み
        content = await file.read()
        logger.info("Audio file content size: %s bytes", len(content))

        # 一時ファイルに保存
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # 音声文字起こし実行
            result = await transcribe_audio_file(temp_file_path)
            logger.info("Transcription completed: %s", result)

            # 文字起こし結果を会議データに保存
            if "transcripts" not in meeting:
                meeting["transcripts"] = []

            # 文字起こし結果にIDとタイムスタンプを追加
            transcript_entry = {
                "id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "text": result.get("text", ""),
                "confidence": result.get("confidence", 0.0),
                "language": result.get("language", "ja"),
            }

            meeting["transcripts"].append(transcript_entry)
            meeting["updated_at"] = datetime.now(timezone.utc)

            # 会議データを保存
            store.save_meeting(meeting_id, meeting)

            logger.info("Transcription completed successfully for meeting %s", meeting_id)
            return transcript_entry

        finally:
            # 一時ファイルを削除
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except HTTPException:
        # HTTPExceptionはそのまま再発生
        raise
    except Exception as e:
        logger.error("Transcription failed for meeting %s: %s", meeting_id, e, exc_info=True)
        raise HTTPException(500, f"Transcription failed: {str(e)}")

