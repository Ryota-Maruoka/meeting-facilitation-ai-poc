import json
import os
from typing import Optional, Dict, Any

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

    def save_meeting(self, meeting_id: str, data: Dict[str, Any]):
        path = self._meeting_path(meeting_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def save_file(self, meeting_id: str, filename: str, content: str):
        folder = os.path.join(self.base_dir, "meetings", meeting_id)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
