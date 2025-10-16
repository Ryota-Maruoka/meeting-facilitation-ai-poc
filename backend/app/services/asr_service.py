"""
統合ASRサービス

Whisper APIとWhisper.cppを統合した音声認識サービス
"""

import os
from enum import Enum
from typing import Optional, List, Union
from pydantic import BaseModel

from .whisper_service import WhisperService, WhisperConfig, TranscriptionChunk
from .whisper_cpp_service import WhisperCppService, WhisperCppConfig


class ASRProvider(str, Enum):
    """ASRプロバイダー"""
    OPENAI_WHISPER = "openai_whisper"
    WHISPER_CPP = "whisper_cpp"


class ASRConfig(BaseModel):
    """ASR設定"""
    provider: ASRProvider
    openai_api_key: Optional[str] = None
    whisper_model_path: Optional[str] = None
    whisper_executable_path: Optional[str] = None
    language: str = "ja"
    temperature: float = 0.0


class ASRService:
    """統合ASRサービス"""
    
    def __init__(self, config: ASRConfig):
        self.config = config
        self._service = self._create_service()
    
    def _create_service(self):
        """設定に基づいてASRサービスを作成"""
        if self.config.provider == ASRProvider.OPENAI_WHISPER:
            if not self.config.openai_api_key:
                raise ValueError("OpenAI API key is required for Whisper API")
            
            whisper_config = WhisperConfig(
                api_key=self.config.openai_api_key,
                model="whisper-1",
                language=self.config.language,
                temperature=self.config.temperature
            )
            return WhisperService(whisper_config)
        
        elif self.config.provider == ASRProvider.WHISPER_CPP:
            if not self.config.whisper_model_path or not self.config.whisper_executable_path:
                raise ValueError("Model path and executable path are required for Whisper.cpp")
            
            whisper_cpp_config = WhisperCppConfig(
                model_path=self.config.whisper_model_path,
                executable_path=self.config.whisper_executable_path,
                language=self.config.language,
                temperature=self.config.temperature
            )
            return WhisperCppService(whisper_cpp_config)
        
        else:
            raise ValueError(f"Unsupported ASR provider: {self.config.provider}")
    
    async def transcribe_file(
        self, 
        file_path: str,
        meeting_id: str
    ) -> List[TranscriptionChunk]:
        """音声ファイルを文字起こし"""
        return await self._service.transcribe_file(file_path, meeting_id)
    
    async def transcribe_audio_data(
        self,
        audio_data: bytes,
        filename: str = "audio.wav",
        meeting_id: str = None
    ) -> List[TranscriptionChunk]:
        """音声データを直接文字起こし"""
        return await self._service.transcribe_audio_data(audio_data, filename, meeting_id)
    
    async def transcribe_realtime_chunk(
        self,
        audio_chunk: bytes,
        chunk_index: int,
        meeting_id: str
    ) -> Optional[TranscriptionChunk]:
        """リアルタイム音声チャンクの文字起こし"""
        return await self._service.transcribe_realtime_chunk(audio_chunk, chunk_index, meeting_id)


def create_asr_service() -> ASRService:
    """環境変数からASRサービスを作成"""
    provider = os.getenv("ASR_PROVIDER", "openai_whisper")
    
    config = ASRConfig(
        provider=ASRProvider(provider),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        whisper_model_path=os.getenv("WHISPER_MODEL_PATH"),
        whisper_executable_path=os.getenv("WHISPER_EXECUTABLE_PATH"),
        language=os.getenv("ASR_LANGUAGE", "ja"),
        temperature=float(os.getenv("ASR_TEMPERATURE", "0.0"))
    )
    
    return ASRService(config)
