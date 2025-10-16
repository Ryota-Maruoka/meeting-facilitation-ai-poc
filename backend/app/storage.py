import json
import os
from typing import Optional, Dict, Any, List

class DataStore:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "meetings"), exist_ok=True)

    def _meeting_path(self, meeting_id: str) -> str:
        return os.path.join(self.base_dir, "meetings", f"{meeting_id}.json")

    def load_meeting(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        path = self._meeting_path(meeting_id)
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _default_serializer(self, obj):
        # datetimeなどをISO文字列に変換
        try:
            import datetime as _dt
            if isinstance(obj, (_dt.datetime, _dt.date)):
                return obj.isoformat()
        except Exception:
            pass
        raise TypeError(f"Type not serializable: {type(obj)}")

    def save_meeting(self, meeting_id: str, data: Dict[str, Any]):
        path = self._meeting_path(meeting_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=self._default_serializer)

    def save_file(self, meeting_id: str, filename: str, content: str):
        folder = os.path.join(self.base_dir, "meetings", meeting_id)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    def list_meetings(self) -> List[Dict[str, Any]]:
        """会議一覧を取得"""
        meetings_dir = os.path.join(self.base_dir, "meetings")
        meetings = []
        
        if not os.path.exists(meetings_dir):
            return meetings
            
        for filename in os.listdir(meetings_dir):
            if filename.endswith(".json") and not os.path.isdir(os.path.join(meetings_dir, filename)):
                meeting_id = filename[:-5]  # .jsonを除去
                meeting = self.load_meeting(meeting_id)
                if meeting:
                    meetings.append(meeting)
        
        # 作成日時で降順ソート（新しい順）
        meetings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return meetings
