"""会議スケジューラー - 3分ごとの要約生成バッチ処理"""
import asyncio
import logging
from typing import Dict, Set
from datetime import datetime, timezone

from ..storage import DataStore
from ..meeting_summarizer.service import summarize_meeting
from ..settings import settings

logger = logging.getLogger(__name__)


class MeetingScheduler:
    """会議中の自動要約生成を管理するスケジューラー"""

    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self.active_meetings: Set[str] = set()
        self.tasks: Dict[str, asyncio.Task] = {}

    def start_meeting_scheduler(self, meeting_id: str):
        """会議の要約スケジューラーを開始する

        Args:
            meeting_id: 会議ID
        """
        if meeting_id in self.active_meetings:
            logger.warning(f"Meeting {meeting_id} scheduler is already running")
            return

        self.active_meetings.add(meeting_id)
        task = asyncio.create_task(self._run_summary_loop(meeting_id))
        self.tasks[meeting_id] = task
        logger.info(f"Started summary scheduler for meeting {meeting_id}")

    def stop_meeting_scheduler(self, meeting_id: str):
        """会議の要約スケジューラーを停止する

        Args:
            meeting_id: 会議ID
        """
        if meeting_id not in self.active_meetings:
            logger.warning(f"Meeting {meeting_id} scheduler is not running")
            return

        self.active_meetings.discard(meeting_id)
        task = self.tasks.pop(meeting_id, None)
        if task:
            task.cancel()
        logger.info(f"Stopped summary scheduler for meeting {meeting_id}")

    async def _run_summary_loop(self, meeting_id: str):
        """3分ごとに要約を生成するループ

        Args:
            meeting_id: 会議ID
        """
        try:
            while meeting_id in self.active_meetings:
                # 3分待機
                await asyncio.sleep(3 * 60)  # 180秒

                # まだアクティブかチェック
                if meeting_id not in self.active_meetings:
                    break

                # 要約を生成
                try:
                    await self._generate_summary(meeting_id)
                except Exception as e:
                    logger.error(f"Failed to generate summary for meeting {meeting_id}: {e}", exc_info=True)

        except asyncio.CancelledError:
            logger.info(f"Summary loop cancelled for meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Summary loop error for meeting {meeting_id}: {e}", exc_info=True)

    async def _generate_summary(self, meeting_id: str):
        """要約を生成してストレージに保存する

        Args:
            meeting_id: 会議ID
        """
        logger.info(f"Generating summary for meeting {meeting_id}")

        # 文字起こしデータを読み込む
        transcripts = self.data_store.load_transcripts(meeting_id)
        if not transcripts:
            logger.warning(f"No transcripts found for meeting {meeting_id}")
            return

        # 全ての文字起こしテキストを結合
        all_text = "\n".join([t.get("text", "") for t in transcripts])

        if not all_text.strip():
            logger.warning(f"Transcript text is empty for meeting {meeting_id}")
            return

        # 要約を生成（非同期実行）
        summary_result = await asyncio.to_thread(
            summarize_meeting, all_text, verbose=True
        )

        # 要約データを作成
        summary_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary_result.summary,
            "decisions": summary_result.decisions,
            "undecided": summary_result.undecided,
            "actions": [action.model_dump() for action in summary_result.actions],
        }

        # 要約データを保存
        self.data_store.save_summary(meeting_id, summary_data)

        logger.info(f"Summary generated and saved for meeting {meeting_id}")


# グローバルスケジューラーインスタンス
_scheduler: MeetingScheduler | None = None


def get_scheduler() -> MeetingScheduler:
    """グローバルスケジューラーインスタンスを取得する

    Returns:
        MeetingScheduler: スケジューラーインスタンス
    """
    global _scheduler
    if _scheduler is None:
        data_store = DataStore(settings.data_dir)
        _scheduler = MeetingScheduler(data_store)
    return _scheduler
