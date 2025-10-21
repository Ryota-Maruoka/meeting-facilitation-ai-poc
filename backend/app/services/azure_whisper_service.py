"""
Azure OpenAI Whisper API サービス

Azure OpenAIのWhisper APIを使用した音声認識機能
"""

from __future__ import annotations

import logging
import tempfile
import wave
import io
from typing import Dict, Any, List
import httpx
from ..settings import settings

logger = logging.getLogger(__name__)


def calculate_audio_duration(audio_data: bytes) -> float:
    """音声データの長さを計算する"""
    try:
        with io.BytesIO(audio_data) as audio_buffer:
            with wave.open(audio_buffer, 'rb') as wav_file:
                frames = wav_file.getnframes()
                sample_rate = wav_file.getframerate()
                duration = frames / float(sample_rate)
                return duration
    except Exception as e:
        logger.warning(f"音声長さの計算に失敗: {e}")
        return 0.0


async def transcribe_with_azure_whisper(audio_file_path: str) -> Dict[str, Any]:
    """
    Azure OpenAI Whisper APIを使用した音声認識

    Args:
        audio_file_path: 音声ファイルのパス

    Returns:
        文字起こし結果
    """
    try:
        logger.info(">>> Azure OpenAI Whisper APIで音声ファイル文字起こし中...")
        
        # Azure OpenAI設定の確認
        if not settings.azure_whisper_endpoint or not settings.azure_whisper_api_key:
            raise ValueError("Azure Whisper設定が不完全です。endpointとapi_keyを設定してください。")
        
        if not settings.azure_whisper_deployment:
            raise ValueError("Azure OpenAI Whisperデプロイメント名が設定されていません。")
        
        # API URLの構築
        url = f"{settings.azure_whisper_endpoint.rstrip('/')}/openai/deployments/{settings.azure_whisper_deployment}/audio/transcriptions"
        
        # ヘッダー設定
        headers = {
            "api-key": settings.azure_whisper_api_key,
        }
        
        # 音声ファイルを読み込み
        with open(audio_file_path, "rb") as audio_file:
            files = {
                "file": (audio_file_path.split("/")[-1], audio_file, "audio/wav"),
            }
            
            # フォームデータ
            data = {
                "model": (None, settings.azure_whisper_deployment),
                "language": (None, settings.asr_language),
                "temperature": (None, str(settings.asr_temperature)),
            }
            
            # API呼び出し
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    headers=headers,
                    files=files,
                    params={"api-version": settings.azure_whisper_api_version}
                )
                
                response.raise_for_status()
                result = response.json()
        
        # 結果の処理
        text = result.get("text", "").strip()
        
        # デバッグ: APIレスポンスの全フィールドをログ出力
        logger.info(f">>> Azure Whisper APIレスポンス: {result}")
        logger.info(f">>> Azure Whisper文字起こし結果: {text[:200] if text else '(empty)'}")
        
        # durationが存在しない場合は、音声ファイルから計算を試行
        duration = result.get("duration", 0.0)
        if duration == 0.0:
            # 音声ファイルから長さを計算
            try:
                with open(audio_file_path, "rb") as f:
                    audio_data = f.read()
                duration = calculate_audio_duration(audio_data)
                logger.info(f">>> 音声ファイルから計算したduration: {duration}秒")
            except Exception as e:
                logger.warning(f"音声ファイルの長さ計算に失敗: {e}")
        
        # segmentsが存在しない場合は空配列を設定
        segments = result.get("segments", [])
        if not segments:
            logger.info(">>> segmentsが空のため、空配列を設定")
        
        # 既存の形式に合わせて返す
        return {
            "text": text,
            "language": result.get("language", settings.asr_language),
            "duration": duration,
            "segments": segments,
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Azure OpenAI Whisper API HTTP エラー: {e.response.status_code} - {e.response.text}")
        raise RuntimeError(f"Azure OpenAI Whisper API エラー: {e.response.status_code}")
    
    except httpx.RequestError as e:
        logger.error(f"Azure OpenAI Whisper API リクエストエラー: {e}")
        error_msg = f"Azure OpenAI Whisper API 接続エラー: {type(e).__name__} - {str(e)}"
        raise RuntimeError(error_msg)
    
    except Exception as e:
        logger.error(f"Azure OpenAI Whisper API 予期しないエラー: {e}")
        error_msg = f"Azure OpenAI Whisper API エラー: {type(e).__name__} - {str(e)}"
        raise RuntimeError(error_msg)


async def transcribe_audio_data_azure_whisper(audio_data: bytes, filename: str = "audio.wav") -> Dict[str, Any]:
    """
    音声データを直接Azure OpenAI Whisper APIで文字起こし

    Args:
        audio_data: 音声バイナリデータ
        filename: ファイル名

    Returns:
        文字起こし結果
    """
    try:
        logger.info(">>> Azure OpenAI Whisper APIで音声データ文字起こし中...")
        
        # Azure OpenAI設定の確認
        if not settings.azure_whisper_endpoint or not settings.azure_whisper_api_key:
            raise ValueError("Azure Whisper設定が不完全です。endpointとapi_keyを設定してください。")
        
        if not settings.azure_whisper_deployment:
            raise ValueError("Azure OpenAI Whisperデプロイメント名が設定されていません。")
        
        # API URLの構築
        url = f"{settings.azure_whisper_endpoint.rstrip('/')}/openai/deployments/{settings.azure_whisper_deployment}/audio/transcriptions"
        
        # ヘッダー設定
        headers = {
            "api-key": settings.azure_whisper_api_key,
        }
        
        # 音声データをファイル形式で送信
        files = {
            "file": (filename, audio_data, "audio/wav"),
        }
        
        # フォームデータ
        data = {
            "model": (None, settings.azure_whisper_deployment),
            "language": (None, settings.asr_language),
            "temperature": (None, str(settings.asr_temperature)),
        }
        
        # API呼び出し（タイムアウトを延長）
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                url,
                headers=headers,
                files=files,
                params={"api-version": settings.azure_whisper_api_version}
            )
            
            response.raise_for_status()
            result = response.json()
        
        # 結果の処理
        text = result.get("text", "").strip()
        
        # デバッグ: APIレスポンスの全フィールドをログ出力
        logger.info(f">>> Azure Whisper APIレスポンス: {result}")
        logger.info(f">>> Azure Whisper文字起こし結果: {text[:200] if text else '(empty)'}")
        
        # durationが存在しない場合は、音声データから計算を試行
        duration = result.get("duration", 0.0)
        if duration == 0.0:
            # 音声データから長さを計算
            duration = calculate_audio_duration(audio_data)
            logger.info(f">>> 音声データから計算したduration: {duration}秒")
        
        # segmentsが存在しない場合は空配列を設定
        segments = result.get("segments", [])
        if not segments:
            logger.info(">>> segmentsが空のため、空配列を設定")
        
        # 既存の形式に合わせて返す
        return {
            "text": text,
            "language": result.get("language", settings.asr_language),
            "duration": duration,
            "segments": segments,
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Azure OpenAI Whisper API HTTP エラー: {e.response.status_code} - {e.response.text}")
        raise RuntimeError(f"Azure OpenAI Whisper API エラー: {e.response.status_code}")
    
    except httpx.RequestError as e:
        logger.error(f"Azure OpenAI Whisper API リクエストエラー: {e}")
        error_msg = f"Azure OpenAI Whisper API 接続エラー: {type(e).__name__} - {str(e)}"
        raise RuntimeError(error_msg)
    
    except Exception as e:
        logger.error(f"Azure OpenAI Whisper API 予期しないエラー: {e}")
        error_msg = f"Azure OpenAI Whisper API エラー: {type(e).__name__} - {str(e)}"
        raise RuntimeError(error_msg)