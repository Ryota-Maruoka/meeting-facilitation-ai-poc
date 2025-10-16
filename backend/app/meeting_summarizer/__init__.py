"""会議要約モジュール

音声文字起こし（ASR）テキストから会議要約を生成する。
"""

from .schema import MeetingSummaryOutput, ActionItem
from .service import summarize_meeting

__all__ = ["MeetingSummaryOutput", "ActionItem", "summarize_meeting"]


