"""会議要約の出力整形

JSON形式またはMarkdown形式で要約結果を整形して出力する。
"""

import json
from typing import Literal
from .schema import MeetingSummaryOutput


def format_as_json(summary: MeetingSummaryOutput, indent: int = 2) -> str:
    """要約結果をJSON形式で整形する
    
    Args:
        summary: 会議要約結果
        indent: インデント幅
        
    Returns:
        整形されたJSON文字列
    """
    return summary.model_dump_json(indent=indent, exclude_none=False)


def format_as_markdown(summary: MeetingSummaryOutput) -> str:
    """要約結果をMarkdown形式で整形する
    
    4セクション構成:
    - # 要約
    - # 決定事項
    - # 未決事項
    - # アクション
    
    Args:
        summary: 会議要約結果
        
    Returns:
        整形されたMarkdown文字列
    """
    lines: list[str] = []
    
    # セクション1: 要約
    lines.append("# 要約")
    lines.append("")
    lines.append(summary.summary)
    lines.append("")
    
    # セクション2: 決定事項
    lines.append("# 決定事項")
    lines.append("")
    if summary.decisions:
        for i, decision in enumerate(summary.decisions, start=1):
            lines.append(f"{i}. {decision}")
    else:
        lines.append("（決定事項なし）")
    lines.append("")
    
    # セクション3: 未決事項
    lines.append("# 未決事項")
    lines.append("")
    if summary.undecided:
        for i, item in enumerate(summary.undecided, start=1):
            lines.append(f"{i}. {item}")
    else:
        lines.append("（未決事項なし）")
    lines.append("")
    
    # セクション4: アクション
    lines.append("# アクション")
    lines.append("")
    if summary.actions:
        for i, action in enumerate(summary.actions, start=1):
            action_line = f"{i}. **{action.title}**"
            details = []
            if action.owner:
                details.append(f"担当: {action.owner}")
            if action.due:
                details.append(f"期限: {action.due}")
            if details:
                action_line += f" ({', '.join(details)})"
            lines.append(action_line)
    else:
        lines.append("（アクションなし）")
    lines.append("")
    
    return "\n".join(lines)


def format_summary(
    summary: MeetingSummaryOutput,
    format_type: Literal["json", "markdown"] = "json"
) -> str:
    """要約結果を指定形式で整形する
    
    Args:
        summary: 会議要約結果
        format_type: 出力形式（"json" または "markdown"）
        
    Returns:
        整形された文字列
    """
    if format_type == "markdown":
        return format_as_markdown(summary)
    else:
        return format_as_json(summary)


