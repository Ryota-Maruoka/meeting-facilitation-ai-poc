from typing import List, Tuple

# Simple stubs for PoC. Replace with real LLM calls as needed.

def generate_mini_summary(text: str) -> dict:
    # naive heuristics: split lines and mine markers
    decisions: List[str] = []
    unresolved: List[str] = []
    actions: List[str] = []
    for line in text.splitlines():
        low = line.lower()
        if any(k in low for k in ["決定", "承認", "確定", "decided", "approved"]):
            decisions.append(line.strip())
        if any(k in low for k in ["未決", "検討", "要確認", "todo", "pending", "課題"]):
            unresolved.append(line.strip())
        if any(k in low for k in ["action", "対応", "依頼", "お願いします", "やる"]):
            actions.append(line.strip())
    return {"decisions": decisions[:5], "unresolved": unresolved[:8], "actions": actions[:8]}


def extract_unresolved(text: str) -> List[str]:
    items: List[str] = []
    for line in text.splitlines():
        low = line.lower()
        if any(k in low for k in ["未決", "検討", "要確認", "pending", "課題", "open question"]):
            items.append(line.strip())
    # Fallback: last sentences without clear decision words
    if not items:
        for line in text.split("。")[-5:]:
            if line and not any(k in line for k in ["決定", "確定", "承認"]):
                items.append(line.strip())
    return items[:10]


def generate_proposals(unresolved: List[str]) -> List[str]:
    proposals: List[str] = []
    for u in unresolved:
        proposals.extend([
            f"'{u}' の不足情報を整理する",
            f"'{u}' について選択肢を3案提示する",
            f"'{u}' に対してPoC/比較検証を行う",
            f"'{u}' を関係者レビューに回す",
        ])
    return proposals[:12]


def render_final_markdown(meeting: dict) -> Tuple[str, str]:
    title = meeting.get("title", "会議")
    date_str = meeting.get("created_at", "")[:10]
    mini = meeting.get("last_summary", {})
    decisions = meeting.get("decisions", [])
    actions = meeting.get("actions", [])
    parking = meeting.get("parking", [])

    md_lines: List[str] = []
    md_lines.append(f"# {title}（{date_str}）")
    md_lines.append("")
    md_lines.append("## ミニ要約（時系列ダイジェスト）")
    for k in ["decisions", "unresolved", "actions"]:
        md_lines.append(f"### {k}")
        for item in mini.get(k, []):
            md_lines.append(f"- {item}")
    md_lines.append("")

    md_lines.append("## 決定")
    for d in decisions:
        md_lines.append(f"- {d.get('content')}\n  - 承認/責任者: {d.get('owner','-')}  根拠: {d.get('reason','-')}  決定時刻: {d.get('timestamp','-')}")

    md_lines.append("")
    md_lines.append("## 未決（提案付き）")
    for u in mini.get("unresolved", []):
        md_lines.append(f"- {u}")

    md_lines.append("")
    md_lines.append("## アクション")
    for a in actions:
        md_lines.append(f"- {a.get('assignee')}: {a.get('content')}（期限: {a.get('due','-')}）")

    md_lines.append("")
    md_lines.append("## Parking Lot")
    for p in parking:
        md_lines.append(f"- {p.get('title')}")

    md = "\n".join(md_lines)

    slack_lines: List[str] = []
    slack_lines.append(f"*{title}（{date_str}）*")
    slack_lines.append("- 決定:")
    for d in decisions[:5]:
        slack_lines.append(f"  • {d.get('content')} (承認: {d.get('owner','-')})")
    slack_lines.append("- 未決:")
    for u in mini.get("unresolved", [])[:5]:
        slack_lines.append(f"  • {u}")
    slack_lines.append("- アクション:")
    for a in actions[:5]:
        slack_lines.append(f"  • {a.get('assignee')}: {a.get('content')}（期限: {a.get('due','-')}）")
    slack_text = "\n".join(slack_lines)
    return md, slack_text
