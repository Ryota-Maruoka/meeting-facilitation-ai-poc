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


def _calculate_elapsed_time(meeting_start_iso: str | None, current_iso: str) -> str:
    """会議開始時刻からの経過時間を計算してHH:MM:SS形式で返す

    Args:
        meeting_start_iso: 会議開始時刻（ISO 8601形式）、Noneの場合は空文字列を返す
        current_iso: 現在のタイムスタンプ（ISO 8601形式）

    Returns:
        HH:MM:SS形式の経過時間
    """
    if not meeting_start_iso:
        return "00:00:00"

    try:
        start_time = datetime.fromisoformat(meeting_start_iso.replace("Z", "+00:00"))
        current_time = datetime.fromisoformat(current_iso.replace("Z", "+00:00"))
        elapsed_ms = (current_time - start_time).total_seconds() * 1000

        # 負の値の場合は00:00:00を返す
        if elapsed_ms < 0:
            return "00:00:00"

        total_seconds = int(elapsed_ms / 1000)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except (ValueError, AttributeError) as e:
        logger.warning("Failed to calculate elapsed time: %s", e)
        return "00:00:00"


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

    # 文字起こしデータを準備
    chunk_data = chunk.model_dump()
    
    # タイムスタンプを追加（絶対時刻）
    current_timestamp = datetime.now(timezone.utc).isoformat()
    chunk_data["timestamp"] = current_timestamp
    
    # 経過時間を計算して追加（会議開始時刻が確定している場合）
    meeting_start_iso = meeting.get("started_at")
    chunk_data["elapsed_time"] = _calculate_elapsed_time(meeting_start_iso, current_timestamp)

    # 新しいストレージ構造: transcripts.jsonに追記
    store.append_transcript(meeting_id, chunk_data)

    # 追加後のカウントを取得
    transcripts = store.load_transcripts(meeting_id)
    return {"ok": True, "count": len(transcripts)}


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

    # 新しいストレージ構造: transcripts.jsonから読み込む
    return store.load_transcripts(meeting_id)


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
            logger.info("=== 文字起こし開始 ===")
            print(f"=== 文字起こし開始: {temp_file_path} ===")

            result = await transcribe_audio_file(temp_file_path)

            logger.info("=== 文字起こし完了 ===")
            
            # ログ出力
            log_data = {
                "text": result.get("text", "")[:100] if result.get("text") else "",
                "language": result.get("language"),
            }
            print(f"=== 文字起こし完了: {log_data} ===")
            logger.info("=== 文字起こし完了: %s ===", log_data)

            # 文字起こし結果にIDとタイムスタンプを追加
            current_timestamp = datetime.now(timezone.utc).isoformat()
            transcript_entry = {
                "id": str(uuid4()),
                "timestamp": current_timestamp,
                "text": result.get("text", ""),
                "language": result.get("language", "ja"),
            }

            # 経過時間を計算して追加（会議開始時刻が確定している場合）
            meeting_start_iso = meeting.get("started_at")
            transcript_entry["elapsed_time"] = _calculate_elapsed_time(
                meeting_start_iso, current_timestamp
            )

            # 新しいストレージ構造: transcripts.jsonに追記
            store.append_transcript(meeting_id, transcript_entry)

            # 音声データを録音ファイルに追記（1つのファイルにまとめる）
            store.append_audio_chunk(meeting_id, content)

            # 会議メタデータの更新日時を更新
            meeting["updated_at"] = datetime.now(timezone.utc)
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

