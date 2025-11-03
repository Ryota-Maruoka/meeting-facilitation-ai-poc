import json
import os
from typing import Optional, Dict, Any, List

class DataStore:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "meetings"), exist_ok=True)

    def _meeting_dir(self, meeting_id: str) -> str:
        """会議ごとのディレクトリパスを取得"""
        return os.path.join(self.base_dir, "meetings", meeting_id)

    def _meeting_path(self, meeting_id: str) -> str:
        """会議メタデータのJSONファイルパスを取得"""
        return os.path.join(self._meeting_dir(meeting_id), "meeting.json")

    def _transcripts_path(self, meeting_id: str) -> str:
        """文字起こしJSONファイルパスを取得"""
        return os.path.join(self._meeting_dir(meeting_id), "transcripts.json")

    def _summary_path(self, meeting_id: str) -> str:
        """要約JSONファイルパスを取得"""
        return os.path.join(self._meeting_dir(meeting_id), "summary.json")

    def _recording_path(self, meeting_id: str) -> str:
        """録音ファイルパスを取得"""
        return os.path.join(self._meeting_dir(meeting_id), "recording.webm")

    def load_meeting(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        """会議メタデータを読み込む"""
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
        """会議メタデータを保存"""
        # 会議ディレクトリを作成
        meeting_dir = self._meeting_dir(meeting_id)
        os.makedirs(meeting_dir, exist_ok=True)

        # 会議メタデータを保存
        path = self._meeting_path(meeting_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=self._default_serializer)

    def save_file(self, meeting_id: str, filename: str, content: str):
        """任意のファイルを会議ディレクトリに保存"""
        folder = self._meeting_dir(meeting_id)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    def append_audio_chunk(self, meeting_id: str, audio_data: bytes):
        """音声チャンクを録音ファイルに追記する

        WebM形式のチャンクを正しく結合するため、各チャンクを個別ファイルとして保存し、
        ダウンロード時にFFmpegで結合する方式に変更。

        Args:
            meeting_id: 会議ID
            audio_data: 音声データ（バイナリ）
        """
        import uuid
        
        # 会議ディレクトリを作成
        meeting_dir = self._meeting_dir(meeting_id)
        os.makedirs(meeting_dir, exist_ok=True)

        # 各チャンクを個別ファイルとして保存（WebMの正しい結合のため）
        chunks_dir = os.path.join(meeting_dir, "audio_chunks")
        os.makedirs(chunks_dir, exist_ok=True)
        
        # チャンクファイル名（タイムスタンプ付き）
        chunk_filename = f"chunk_{uuid.uuid4().hex[:8]}.webm"
        chunk_path = os.path.join(chunks_dir, chunk_filename)
        
        # チャンクを個別ファイルとして保存
        with open(chunk_path, "wb") as f:
            f.write(audio_data)
        
        # ダウンロード時は audio_chunks から FFmpeg で正しく結合する
        legacy_path = self._recording_path(meeting_id)
        with open(legacy_path, "ab") as f:  # "ab" = append binary
            f.write(audio_data)

    def get_recording_path(self, meeting_id: str) -> str:
        """録音ファイルのパスを取得する（ダウンロード用）

        Args:
            meeting_id: 会議ID

        Returns:
            録音ファイルの絶対パス（結合済みファイル、または個別チャンクのディレクトリ）
        """
        return self._recording_path(meeting_id)
    
    def get_audio_chunks_dir(self, meeting_id: str) -> str:
        """音声チャンクのディレクトリパスを取得

        Args:
            meeting_id: 会議ID

        Returns:
            音声チャンクのディレクトリパス
        """
        return os.path.join(self._meeting_dir(meeting_id), "audio_chunks")
    
    def list_audio_chunks(self, meeting_id: str) -> list[str]:
        """音声チャンクファイルのリストを取得（ソート済み）

        Args:
            meeting_id: 会議ID

        Returns:
            音声チャンクファイルのパスのリスト（ファイル名でソート）
        """
        chunks_dir = self.get_audio_chunks_dir(meeting_id)
        if not os.path.exists(chunks_dir):
            return []
        
        chunk_files = [
            os.path.join(chunks_dir, f)
            for f in os.listdir(chunks_dir)
            if f.endswith('.webm')
        ]
        
        # ファイル名でソート（chunk_の後の部分でソート）
        chunk_files.sort()
        return chunk_files

    def load_transcripts(self, meeting_id: str) -> List[Dict[str, Any]]:
        """文字起こしデータを読み込む"""
        path = self._transcripts_path(meeting_id)
        if not os.path.exists(path):
            return []

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_transcripts(self, meeting_id: str, transcripts: List[Dict[str, Any]]):
        """文字起こしデータを保存"""
        meeting_dir = self._meeting_dir(meeting_id)
        os.makedirs(meeting_dir, exist_ok=True)

        path = self._transcripts_path(meeting_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(transcripts, f, ensure_ascii=False, indent=2, default=self._default_serializer)

    def append_transcript(self, meeting_id: str, transcript: Dict[str, Any]):
        """文字起こしデータを追記"""
        transcripts = self.load_transcripts(meeting_id)
        transcripts.append(transcript)
        self.save_transcripts(meeting_id, transcripts)

    def load_summary(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        """要約データを読み込む"""
        path = self._summary_path(meeting_id)
        if not os.path.exists(path):
            return None

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_summary(self, meeting_id: str, summary: Dict[str, Any]):
        """要約データを保存（上書き）"""
        meeting_dir = self._meeting_dir(meeting_id)
        os.makedirs(meeting_dir, exist_ok=True)

        path = self._summary_path(meeting_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2, default=self._default_serializer)

    def list_meetings(self) -> List[Dict[str, Any]]:
        """会議一覧を取得"""
        meetings_dir = os.path.join(self.base_dir, "meetings")
        meetings = []

        if not os.path.exists(meetings_dir):
            return meetings

        try:
            for item in os.listdir(meetings_dir):
                item_path = os.path.join(meetings_dir, item)

                # 新形式: ディレクトリ
                if os.path.isdir(item_path):
                    meeting_id = item
                    meeting = self.load_meeting(meeting_id)
                    if meeting:
                        meetings.append(meeting)

                # 旧形式: {meeting_id}.json ファイル（後方互換性）
                elif item.endswith(".json"):
                    meeting_id = item[:-5]  # .jsonを除去
                    # 旧形式のファイルを読み込む
                    old_path = os.path.join(meetings_dir, item)
                    try:
                        with open(old_path, "r", encoding="utf-8") as f:
                            meeting = json.load(f)
                            if meeting:
                                meetings.append(meeting)
                    except Exception as e:
                        print(f"Warning: Failed to load old format meeting {item}: {e}")

        except Exception as e:
            print(f"Error listing meetings: {e}")
            return []

        # 作成日時で降順ソート（新しい順）
        meetings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return meetings

    def delete_meeting(self, meeting_id: str):
        """会議データを削除する

        Args:
            meeting_id: 会議ID

        Raises:
            FileNotFoundError: 会議データが存在しない場合
        """
        import shutil

        meeting_dir = self._meeting_dir(meeting_id)
        if not os.path.exists(meeting_dir):
            raise FileNotFoundError(f"Meeting {meeting_id} not found")

        # ディレクトリごと削除
        shutil.rmtree(meeting_dir)
