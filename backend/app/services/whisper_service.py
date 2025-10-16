"""
Whisper API サービス

OpenAI Whisper APIを使用した音声認識機能
"""

import os
import base64
import httpx
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class WhisperConfig(BaseModel):
    """Whisper設定"""
    api_key: str
    model: str = "whisper-1"
    language: Optional[str] = None
    temperature: float = 0.0
    response_format: str = "verbose_json"


class TranscriptionChunk(BaseModel):
    """文字起こしチャンク"""
    text: str
    start_time: float
    end_time: float
    speaker: Optional[str] = None
    confidence: float = 1.0


class WhisperService:
    """Whisper API サービス"""
    
    def __init__(self, config: WhisperConfig):
        self.config = config
        self.base_url = "https://api.openai.com/v1/audio/transcriptions"
        self.headers = {
            "Authorization": f"Bearer {config.api_key}",
        }
    
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
            with open(file_path, "rb") as audio_file:
                files = {
                    "file": (os.path.basename(file_path), audio_file, "audio/wav")
                }
                data = {
                    "model": self.config.model,
                    "language": self.config.language,
                    "temperature": self.config.temperature,
                    "response_format": self.config.response_format,
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.base_url,
                        headers=self.headers,
                        files=files,
                        data=data,
                        timeout=60.0
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    return self._parse_transcription(result)
                    
        except Exception as e:
            print(f"Whisper API error: {e}")
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
            files = {
                "file": (filename, audio_data, "audio/wav")
            }
            data = {
                "model": self.config.model,
                "language": self.config.language,
                "temperature": self.config.temperature,
                "response_format": self.config.response_format,
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers=self.headers,
                    files=files,
                    data=data,
                    timeout=60.0
                )
                response.raise_for_status()
                
                result = response.json()
                return self._parse_transcription(result)
                
        except Exception as e:
            print(f"Whisper API error: {e}")
            raise
    
    def _parse_transcription(self, result: Dict[str, Any]) -> List[TranscriptionChunk]:
        """
        Whisper APIの結果をパース
        
        Args:
            result: Whisper APIのレスポンス
            
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
def create_whisper_service() -> WhisperService:
    """Whisperサービスを作成"""
    config = WhisperConfig(
        api_key=os.getenv("OPENAI_API_KEY", ""),
        model="whisper-1",
        language="ja",  # 日本語
        temperature=0.0,
        response_format="verbose_json"
    )
    return WhisperService(config)
