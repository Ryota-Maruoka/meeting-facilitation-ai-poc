"""要約・分析エンドポイント"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..schemas.summary import MiniSummary
from ..storage import DataStore
from ..services.llm import (
    generate_mini_summary,
    extract_unresolved,
    generate_proposals,
    render_final_markdown,
)
from ..services.deviation import check_deviation, check_realtime_deviation
from ..meeting_summarizer.service import summarize_meeting
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["summaries"])

# DataStore
store = DataStore(settings.data_dir)


@router.post("/summaries/generate", response_model=MiniSummary)
def generate_summary(meeting_id: str, window_min: int = 3) -> MiniSummary:
    """ミニ要約を生成する。

    Args:
        meeting_id: 会議ID
        window_min: 要約ウィンドウ（分）

    Returns:
        ミニ要約

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    now_end = max([t.get("end_sec", 0) for t in meeting.get("transcripts", [])] + [0])
    window_start = max(0, now_end - window_min * 60)
    recent_texts = [
        t["text"]
        for t in meeting.get("transcripts", [])
        if t.get("start_sec", 0) >= window_start
    ]
    text = "\n".join(recent_texts)
    summary = generate_mini_summary(text)
    # Persist last summary snapshot (optional)
    meeting["last_summary"] = summary
    store.save_meeting(meeting_id, meeting)
    return summary


@router.post("/unresolved/extract")
def api_extract_unresolved(meeting_id: str) -> dict:
    """未決事項を抽出する。

    Args:
        meeting_id: 会議ID

    Returns:
        未決事項リスト

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    text = "\n".join(t["text"] for t in meeting.get("transcripts", []))
    return {"unresolved": extract_unresolved(text)}


@router.post("/proposals/generate")
def api_generate_proposals(meeting_id: str) -> dict:
    """提案を生成する。

    Args:
        meeting_id: 会議ID

    Returns:
        提案リスト

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    unresolved = meeting.get("last_summary", {}).get("unresolved", [])
    return {"proposals": generate_proposals(unresolved)}


@router.post("/deviation/check")
async def check_meeting_deviation(meeting_id: str) -> dict:
    """会議の脱線検知を実行する（AIベース）。

    Args:
        meeting_id: 会議ID

    Returns:
        脱線検知結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    try:
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            raise HTTPException(404, "Meeting not found")

        # アジェンダタイトルを取得
        agenda_titles = []
        if "agenda" in meeting and meeting["agenda"]:
            agenda_titles = [
                item.get("title", "") for item in meeting["agenda"] if item.get("title")
            ]

        if not agenda_titles:
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "message": "アジェンダが設定されていません",
                "suggested_agenda": [],
                "reasoning": "アジェンダが設定されていないため脱線検知をスキップ"
            }

        # 直近の文字起こし結果を取得
        transcripts = meeting.get("transcripts", [])
        if not transcripts:
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "message": "文字起こしデータがありません",
                "suggested_agenda": [],
                "reasoning": "文字起こしデータがないため脱線検知をスキップ"
            }

        # AIベースの脱線検知を実行
        deviation_result = await check_realtime_deviation(
            recent_transcripts=transcripts,
            agenda_titles=agenda_titles,
            threshold=0.3,
            consecutive_chunks=3,
        )

        logger.info("AI脱線検知完了 for meeting %s: %s", meeting_id, deviation_result)
        return deviation_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI脱線検知エラー for meeting %s: %s", meeting_id, e, exc_info=True)
        raise HTTPException(500, f"脱線検知に失敗しました: {str(e)}")


@router.post("/summary/final")
def final_summary(meeting_id: str) -> dict:
    """最終サマリを生成する。

    Args:
        meeting_id: 会議ID

    Returns:
        最終サマリ（Markdown形式）

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    md, slack_text = render_final_markdown(meeting)
    # Persist for download/export
    store.save_file(meeting_id, "summary.md", md)
    return {"markdown": md, "slack_text": slack_text}


@router.get("/summary")
def get_summary(meeting_id: str) -> dict:
    """会議要約を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        要約データ

    Raises:
        HTTPException: 会議が見つからない場合、要約データがない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 要約データを読み込む
    summary = store.load_summary(meeting_id)
    if not summary:
        raise HTTPException(404, "Summary not found")

    return summary


@router.post("/summary/generate")
def generate_meeting_summary(meeting_id: str) -> dict:
    """会議要約を生成する。

    全ての文字起こしテキストを要約APIに送信し、要約を生成する。
    生成された要約はsummary.jsonに保存される。

    Args:
        meeting_id: 会議ID

    Returns:
        生成された要約データ

    Raises:
        HTTPException: 会議が見つからない場合、文字起こしデータがない場合
    """
    try:
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            raise HTTPException(404, "Meeting not found")

        # 文字起こしデータを読み込む
        transcripts = store.load_transcripts(meeting_id)
        if not transcripts:
            raise HTTPException(400, "No transcripts found for this meeting")

        # 全ての文字起こしテキストを結合
        all_text = "\n".join([t.get("text", "") for t in transcripts])

        if not all_text.strip():
            raise HTTPException(400, "Transcript text is empty")

        logger.info("Generating summary for meeting %s", meeting_id)

        # 要約を生成
        summary_result = summarize_meeting(all_text, verbose=True)

        # 要約データを作成
        summary_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary_result.summary,
            "decisions": summary_result.decisions,
            "undecided": summary_result.undecided,
            "actions": [action.model_dump() for action in summary_result.actions],
        }

        # 要約データを保存
        store.save_summary(meeting_id, summary_data)

        logger.info("Summary generated and saved for meeting %s", meeting_id)

        return summary_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Summary generation failed for meeting %s: %s", meeting_id, e, exc_info=True)
        raise HTTPException(500, f"Summary generation failed: {str(e)}")

