"""会議要約の出力スキーマ定義"""

from typing import Optional
from pydantic import BaseModel, Field


class ActionItem(BaseModel):
    """アクションアイテム"""
    
    title: str = Field(..., description="アクション内容")
    owner: Optional[str] = Field(None, description="担当者")
    due: Optional[str] = Field(None, description="期限（ISO-8601形式、曖昧な場合はnull）")


class MeetingSummaryOutput(BaseModel):
    """会議要約の出力スキーマ
    
    Azure OpenAI Responses APIから返されるJSON構造を厳格に検証する。
    """
    
    summary: str = Field(..., description="会議全体の要約（文字数指定なし・自然な長さ）")
    decisions: list[str] = Field(default_factory=list, description="決定事項の配列")
    undecided: list[str] = Field(default_factory=list, description="未決事項の配列")
    actions: list[ActionItem] = Field(default_factory=list, description="アクションアイテムの配列")


# Azure OpenAI Responses API用のJSON Schemaスキーマ
MEETING_SUMMARY_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "decisions": {"type": "array", "items": {"type": "string"}},
        "undecided": {"type": "array", "items": {"type": "string"}},
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "owner": {"type": "string"},
                    "due": {"type": "string"}
                },
                "required": ["title", "owner", "due"]
            }
        }
    },
    "required": ["summary", "decisions", "undecided", "actions"]
}

