"""
Whisper.cpp サービス

ローカルでWhisper.cppを実行する音声認識機能
"""

import os
import subprocess
import tempfile
import json
from typing import Optional, List, Dict, Any
from pathlib import Path
from pydantic import BaseModel


class WhisperCppConfig(BaseModel):
    """Whisper.cpp設定"""
    model_path: str  # モデルファイルのパス
    executable_path: str  # whisper.cppの実行ファイルパス
    language: str = "ja"
    temperature: float = 0.0
    max_len: int = 0  # 最大長（0=無制限）


class TranscriptionChunk(BaseModel):
    """文字起こしチャンク"""
    text: str
    start_time: float
    end_time: float
    speaker: Optional[str] = None
    confidence: float = 1.0


class WhisperCppService:
    """Whisper.cpp サービス"""
    
    def __init__(self, config: WhisperCppConfig):
        self.config = config
        self._validate_setup()
    
    def _validate_setup(self):
        """セットアップの検証"""
        if not os.path.exists(self.config.executable_path):
            raise FileNotFoundError(f"Whisper.cpp executable not found: {self.config.executable_path}")
        
        if not os.path.exists(self.config.model_path):
            raise FileNotFoundError(f"Model file not found: {self.config.model_path}")
    
    async def transcribe_file(
        self, 
        file_path: str,
        meeting_id: str
    ) -> List[TranscriptionChunk]:
        """
        音声ファイルを文字起こし
        
        Args:
            file_path: 音声ファイルのパス
            meeting_id: 会議ID
            
        Returns:
            文字起こしチャンクのリスト
        """
        try:
            # 一時ファイルを作成してJSON出力を受け取る
            with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as temp_file:
                temp_json_path = temp_file.name
            
            # Whisper.cppを実行
            cmd = [
                self.config.executable_path,
                "-m", self.config.model_path,
                "-f", file_path,
                "-l", self.config.language,
                "-t", str(self.config.temperature),
                "-ml", str(self.config.max_len),
                "--output-json",
                "--output-file", temp_json_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5分タイムアウト
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"Whisper.cpp failed: {result.stderr}")
            
            # JSON結果を読み込み
            with open(temp_json_path, 'r', encoding='utf-8') as f:
                result_data = json.load(f)
            
            # 一時ファイルを削除
            os.unlink(temp_json_path)
            
            return self._parse_transcription(result_data)
            
        except Exception as e:
            print(f"Whisper.cpp error: {e}")
            raise
    
    async def transcribe_audio_data(
        self,
        audio_data: bytes,
        filename: str = "audio.wav",
        meeting_id: str = None
    ) -> List[TranscriptionChunk]:
        """
        音声データを直接文字起こし
        
        Args:
            audio_data: 音声バイナリデータ
            filename: ファイル名
            meeting_id: 会議ID
            
        Returns:
            文字起こしチャンクのリスト
        """
        try:
            # 一時ファイルに音声データを保存
            with tempfile.NamedTemporaryFile(suffix=f".{filename.split('.')[-1]}", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_audio_path = temp_file.name
            
            # 文字起こし実行
            chunks = await self.transcribe_file(temp_audio_path, meeting_id)
            
            # 一時ファイルを削除
            os.unlink(temp_audio_path)
            
            return chunks
            
        except Exception as e:
            print(f"Whisper.cpp audio data error: {e}")
            raise
    
    def _parse_transcription(self, result: Dict[str, Any]) -> List[TranscriptionChunk]:
        """
        Whisper.cppの結果をパース
        
        Args:
            result: Whisper.cppのJSON出力
            
        Returns:
            文字起こしチャンクのリスト
        """
        chunks = []
        
        if "segments" in result:
            for segment in result["segments"]:
                chunk = TranscriptionChunk(
                    text=segment.get("text", "").strip(),
                    start_time=segment.get("start", 0.0),
                    end_time=segment.get("end", 0.0),
                    confidence=segment.get("avg_logprob", 0.0)  # 信頼度の近似
                )
                chunks.append(chunk)
        else:
            # セグメント情報がない場合は全体を1つのチャンクとして扱う
            chunk = TranscriptionChunk(
                text=result.get("text", "").strip(),
                start_time=0.0,
                end_time=0.0,
                confidence=1.0
            )
            chunks.append(chunk)
        
        return chunks
    
    async def transcribe_realtime_chunk(
        self,
        audio_chunk: bytes,
        chunk_index: int,
        meeting_id: str
    ) -> Optional[TranscriptionChunk]:
        """
        リアルタイム音声チャンクの文字起こし
        
        Args:
            audio_chunk: 音声チャンクデータ
            chunk_index: チャンクインデックス
            meeting_id: 会議ID
            
        Returns:
            文字起こしチャンク（失敗時はNone）
        """
        try:
            filename = f"chunk_{chunk_index}_{meeting_id}.wav"
            chunks = await self.transcribe_audio_data(
                audio_chunk, 
                filename, 
                meeting_id
            )
            
            if chunks:
                return chunks[0]  # 最初のチャンクを返す
            return None
            
        except Exception as e:
            print(f"Real-time transcription error: {e}")
            return None


# 設定例
def create_whisper_cpp_service() -> WhisperCppService:
    """Whisper.cppサービスを作成"""
    config = WhisperCppConfig(
        model_path=os.getenv("WHISPER_MODEL_PATH", "./models/ggml-base.bin"),
        executable_path=os.getenv("WHISPER_EXECUTABLE_PATH", "./whisper"),
        language="ja",
        temperature=0.0,
        max_len=0
    )
    return WhisperCppService(config)
