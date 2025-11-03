"""要約・分析エンドポイント"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, BackgroundTasks

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
    # 注意: parkingフィールドなどの既存データを保護するため、保存前に最新データを再読み込み
    meeting_to_update = store.load_meeting(meeting_id)
    if meeting_to_update:
        meeting_to_update["last_summary"] = summary
        store.save_meeting(meeting_id, meeting_to_update)
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

        # アジェンダ項目を取得（タイトル、期待成果物を含む）
        agenda_items = []
        if "agenda" in meeting and meeting["agenda"]:
            agenda_items = [
                {
                    "title": item.get("title", ""),
                    "expectedOutcome": item.get("expectedOutcome", ""),
                    "duration": item.get("duration", 0),
                }
                for item in meeting["agenda"]
                if item.get("title")
            ]

        logger.info("🔍 脱線検知開始: meeting_id=%s", meeting_id)
        logger.info("📋 アジェンダ項目数: %d", len(agenda_items))
        for idx, item in enumerate(agenda_items, 1):
            logger.info("  アジェンダ%d: タイトル=%s, 期待成果物=%s, 所要時間=%d分",
                       idx, item.get("title", ""), item.get("expectedOutcome", ""), item.get("duration", 0))

        if not agenda_items:
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "similarity_score": 0.0,
                "best_agenda": "",
                "message": "アジェンダが設定されていません",
                "suggested_agenda": [],
                "recent_text": "",
                "reasoning": "アジェンダが設定されていないため脱線検知をスキップ",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # 直近の文字起こし結果を取得（transcripts.jsonから読み込む）
        transcripts = store.load_transcripts(meeting_id)
        logger.info("📝 文字起こしデータ件数: %d", len(transcripts))
        
        if not transcripts:
            logger.warning("⚠️ 文字起こしデータがありません")
            return {
                "is_deviation": False,
                "confidence": 0.0,
                "similarity_score": 0.0,
                "best_agenda": "",
                "message": "文字起こしデータがありません",
                "suggested_agenda": [],
                "recent_text": "",
                "reasoning": "文字起こしデータがないため脱線検知をスキップ",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # 直近3件の文字起こし内容をログ出力（デバッグ用）
        recent_count = min(3, len(transcripts))
        logger.info("📄 直近%d件の文字起こし内容:", recent_count)
        for i, t in enumerate(transcripts[-recent_count:], 1):
            text_preview = t.get("text", "")[:100]  # 最初の100文字
            logger.info("  [%d] %s... (text length: %d)", i, text_preview, len(t.get("text", "")))

        # AIベースの脱線検知を実行（アジェンダ項目全体を渡す）
        logger.info("🤖 AI脱線検知を実行中...")
        deviation_result = await check_realtime_deviation(
            recent_transcripts=transcripts,
            agenda_items=agenda_items,
            threshold=0.3,
            consecutive_chunks=3,
        )

        logger.info("✅ 脱線検知完了: meeting_id=%s", meeting_id)
        logger.info("📊 判定結果: is_deviation=%s, similarity_score=%.3f, confidence=%.3f",
                   deviation_result.get("is_deviation"), 
                   deviation_result.get("similarity_score", 0.0),
                   deviation_result.get("confidence", 0.0))
        logger.info("📌 最適アジェンダ: %s", deviation_result.get("best_agenda", ""))
        logger.info("💬 メッセージ: %s", deviation_result.get("message", ""))
        logger.info("🔍 判定理由: %s", deviation_result.get("reasoning", "")[:200])  # 最初の200文字
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
            raise HTTPException(400, "文字起こしデータが見つかりません。会議中に音声を録音してください。")

        # 全ての文字起こしテキストを結合
        all_text_full = "\n".join([t.get("text", "") for t in transcripts])

        if not all_text_full.strip():
            raise HTTPException(400, "文字起こしテキストが空です。会議中に音声を録音してください。")

        # 入力サイズ制限（安全側）：過度な長文で時間超過しないように直近N文字に制限
        # ここでは直近 ~30,000 文字を上限に設定
        MAX_CHARS = 30000
        all_text = all_text_full[-MAX_CHARS:] if len(all_text_full) > MAX_CHARS else all_text_full

        logger.info("Generating summary for meeting %s (input_chars=%d, truncated=%s)", 
                   meeting_id, len(all_text), len(all_text_full) > MAX_CHARS)

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


@router.post("/summary/generate_async")
def generate_meeting_summary_async(meeting_id: str, background: BackgroundTasks) -> dict:
    """会議要約を非同期に生成する。

    - 直ちに 202 相当のレスポンスを返し、バックグラウンドで要約を生成して保存する
    - 完了確認は GET /meetings/{id}/summary（存在すれば200、なければ404）

    Args:
        meeting_id: 会議ID

    Returns:
        受け付け結果（accepted: true）

    Raises:
        HTTPException: 会議が見つからない場合、文字起こしが皆無の場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    transcripts = store.load_transcripts(meeting_id)
    if not transcripts:
        raise HTTPException(400, "文字起こしデータが見つかりません。会議中に音声を録音してください。")

    # 入力サイズ制限（安全側）：過度な長文で時間超過しないように直近N文字に制限
    # ここでは直近 ~30,000 文字を上限に設定
    all_text_full = "\n".join([t.get("text", "") for t in transcripts])
    MAX_CHARS = 30000
    all_text = all_text_full[-MAX_CHARS:] if len(all_text_full) > MAX_CHARS else all_text_full

    def _run():
        try:
            logger.info("[ASYNC] Summary generation started: meeting_id=%s, input_chars=%d", meeting_id, len(all_text))
            result = summarize_meeting(all_text, verbose=True)
            summary_data = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "summary": result.summary,
                "decisions": result.decisions,
                "undecided": result.undecided,
                "actions": [action.model_dump() for action in result.actions],
            }
            store.save_summary(meeting_id, summary_data)
            logger.info("[ASYNC] Summary generated and saved: meeting_id=%s", meeting_id)
        except Exception as exc:  # 失敗時もログのみ（APIは既に返却済み）
            logger.error("[ASYNC] Summary generation failed: meeting_id=%s, error=%s", meeting_id, exc, exc_info=True)

    background.add_task(_run)
    # 受け付けたことだけ返却（FastAPI は200を返すが、クライアント側はacceptedを見て判断）
    return {"accepted": True}
