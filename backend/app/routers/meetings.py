"""会議管理エンドポイント"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, BackgroundTasks

from ..schemas.meeting import Meeting, MeetingCreate
from ..storage import DataStore
from ..services.meeting_scheduler import get_scheduler
from ..meeting_summarizer.service import summarize_meeting
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings", tags=["meetings"])

# DataStore
store = DataStore(settings.data_dir)


def _normalize_meeting_dict(meeting_dict: dict) -> dict:
    """会議データを正規化する。

    旧スキーマのキーを新スキーマに変換し、不要なフィールドを除去する。

    Args:
        meeting_dict: 生の会議データ

    Returns:
        正規化された会議データ
    """
    normalized = meeting_dict.copy()

    # 旧キーを新キーに変換（アジェンダアイテム内）
    if "agenda" in normalized and isinstance(normalized["agenda"], list):
        for item in normalized["agenda"]:
            if isinstance(item, dict):
                if "duration_min" in item:
                    item["duration"] = item.pop("duration_min")
                if "expected_outcome" in item:
                    item["expectedOutcome"] = item.pop("expected_outcome")
                if "resource_url" in item:
                    item["relatedUrl"] = item.pop("resource_url")

    # 不要なフィールドを除去（Meetingモデルに定義されていないフィールド）
    extra_fields = [
        "transcripts",
        "decisions",
        "actions",
        "parking",
        "summary",
        "mini_summary",
        "deviation_alerts",
    ]
    for field in extra_fields:
        normalized.pop(field, None)

    # updated_atが無い場合はcreated_atを使用
    if "updated_at" not in normalized and "created_at" in normalized:
        normalized["updated_at"] = normalized["created_at"]

    return normalized


@router.get("", response_model=list[Meeting])
def list_meetings() -> list[Meeting]:
    """会議一覧を取得する。

    Returns:
        会議一覧
    """
    try:
        meetings = store.list_meetings()
        return [Meeting(**_normalize_meeting_dict(meeting)) for meeting in meetings]
    except Exception as e:
        logger.error("Failed to list meetings: %s", e, exc_info=True)
        # エラー時は空のリストを返す
        return []


@router.post("", response_model=Meeting, status_code=201)
def create_meeting(payload: dict) -> Meeting:
    """会議を作成する。

    会議情報を受け取り、データストアに保存して作成された会議を返す。
    IDが指定されている場合はそれを使用し、指定されていない場合は新規生成する。

    Args:
        payload: 会議作成リクエストデータ（IDが含まれる場合がある）

    Returns:
        作成された会議情報

    Raises:
        ValidationError: ビジネスルール違反（参加者数上限等）
        InfrastructureError: データストアエラー
    """
    # IDが指定されている場合はそれを使用、そうでなければ新規生成
    meeting_id = payload.get("id", str(uuid4()))
    now = datetime.now(timezone.utc)
    
    # payloadからMeetingCreateのフィールドを抽出
    meeting_create = MeetingCreate(
        title=payload["title"],
        purpose=payload["purpose"],
        deliverable_template=payload["deliverable_template"],
        meetingDate=payload.get("meetingDate"),
        participants=payload.get("participants", []),
        agenda=payload.get("agenda", [])
    )

    meeting_data = {
        "id": meeting_id,
        "created_at": now,
        "updated_at": now,
        "title": meeting_create.title,
        "purpose": meeting_create.purpose,
        "deliverable_template": meeting_create.deliverable_template,
        "meetingDate": meeting_create.meetingDate,
        "participants": meeting_create.participants,
        "agenda": [item.model_dump() for item in meeting_create.agenda],
        "status": "draft",
    }

    try:
        store.save_meeting(meeting_id, meeting_data)

        # 空のtranscripts.jsonとsummary.jsonを初期化
        store.save_transcripts(meeting_id, [])
        store.save_summary(meeting_id, {
            "generated_at": None,
            "summary": "",
            "decisions": [],
            "undecided": [],
            "actions": []
        })

        logger.info("Meeting created successfully: %s", meeting_id)
        return Meeting(**meeting_data)
    except Exception as e:
        logger.error("Failed to create meeting: %s", e, exc_info=True)
        # 詳細なエラー情報を返す
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create meeting: {str(e)}"
        )


@router.get("/{meeting_id}", response_model=Meeting)
def get_meeting(meeting_id: str) -> Meeting:
    """会議詳細を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        会議詳細情報

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return Meeting(**_normalize_meeting_dict(meeting))


@router.put("/{meeting_id}", response_model=Meeting)
def update_meeting(meeting_id: str, payload: dict) -> Meeting:
    """会議情報を更新する。

    Args:
        meeting_id: 会議ID
        payload: 更新データ

    Returns:
        更新された会議情報

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 更新可能なフィールドを更新
    if "status" in payload:
        meeting["status"] = payload["status"]
    if "started_at" in payload:
        meeting["started_at"] = payload["started_at"]
    if "ended_at" in payload:
        meeting["ended_at"] = payload["ended_at"]
    if "started_at" in payload:
        meeting["started_at"] = payload["started_at"]
    if "summary" in payload:
        meeting["summary"] = payload["summary"]
    if "title" in payload:
        meeting["title"] = payload["title"]
    if "purpose" in payload:
        meeting["purpose"] = payload["purpose"]
    if "deliverable_template" in payload:
        meeting["deliverable_template"] = payload["deliverable_template"]
    if "meetingDate" in payload:
        meeting["meetingDate"] = payload["meetingDate"]
    if "participants" in payload:
        meeting["participants"] = payload["participants"]
    if "agenda" in payload:
        meeting["agenda"] = payload["agenda"]

    # 更新日時を設定
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()

    # 保存
    store.save_meeting(meeting_id, meeting)
    return Meeting(**_normalize_meeting_dict(meeting))


@router.post("/{meeting_id}/start", response_model=Meeting)
async def start_meeting(meeting_id: str) -> Meeting:
    """会議を開始する。

    Args:
        meeting_id: 会議ID

    Returns:
        更新された会議情報

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 会議開始時刻を記録
    meeting["started_at"] = datetime.now(timezone.utc).isoformat()
    meeting["status"] = "in_progress"
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()

    # 保存
    store.save_meeting(meeting_id, meeting)
    logger.info("Meeting started: %s", meeting_id)

    # 3分ごとの要約生成スケジューラーを開始
    scheduler = get_scheduler()
    await scheduler.start_meeting_scheduler(meeting_id)

    return Meeting(**_normalize_meeting_dict(meeting))


async def _generate_final_summary_background(meeting_id: str):
    """バックグラウンドで最終要約を生成する"""
    try:
        transcripts = store.load_transcripts(meeting_id)
        if transcripts:
            all_text = "\n".join([t.get("text", "") for t in transcripts])
            if all_text.strip():
                logger.info("Generating final summary for meeting %s", meeting_id)

                # 非同期で要約を生成
                summary_result = await asyncio.to_thread(
                    summarize_meeting, all_text, verbose=True
                )

                summary_data = {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "summary": summary_result.summary,
                    "decisions": summary_result.decisions,
                    "undecided": summary_result.undecided,
                    "actions": [action.model_dump() for action in summary_result.actions],
                }

                store.save_summary(meeting_id, summary_data)
                logger.info("Final summary saved for meeting %s", meeting_id)
    except Exception as e:
        logger.error("Failed to generate final summary: %s", e)


@router.post("/{meeting_id}/end", response_model=Meeting)
async def end_meeting(meeting_id: str, background_tasks: BackgroundTasks) -> Meeting:
    """会議を終了する。

    Args:
        meeting_id: 会議ID
        background_tasks: FastAPIバックグラウンドタスク

    Returns:
        更新された会議情報

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 1分ごとの要約生成スケジューラーを停止
    scheduler = get_scheduler()
    scheduler.stop_meeting_scheduler(meeting_id)

    # 会議終了時刻を記録
    meeting["ended_at"] = datetime.now(timezone.utc).isoformat()
    meeting["status"] = "completed"
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()

    # 保存
    store.save_meeting(meeting_id, meeting)
    logger.info("Meeting ended: %s", meeting_id)

    # 最終要約をバックグラウンドで生成
    background_tasks.add_task(_generate_final_summary_background, meeting_id)

    return Meeting(**_normalize_meeting_dict(meeting))


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str) -> None:
    """会議を削除する。

    Args:
        meeting_id: 会議ID

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    try:
        store.delete_meeting(meeting_id)
        logger.info("Meeting deleted: %s", meeting_id)
    except Exception as e:
        logger.error("Failed to delete meeting %s: %s", meeting_id, e)
        raise HTTPException(500, "Failed to delete meeting")

