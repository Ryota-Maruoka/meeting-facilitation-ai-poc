"""
無料ASRサービス

完全無料の音声認識機能
"""

import os
import subprocess
import tempfile
import json
import wave
import struct
from typing import List, Dict, Any
from pathlib import Path


def transcribe_audio_free(content: bytes, chunk_seconds: int = 30) -> List[Dict]:
    """
    完全無料の音声認識
    
    Args:
        content: 音声バイナリデータ
        chunk_seconds: チャンクの秒数
        
    Returns:
        文字起こしチャンクのリスト
    """
    # 1. Whisper.cppを試行
    try:
        return transcribe_with_whisper_cpp(content)
    except Exception as e:
        print(f"Whisper.cpp failed: {e}")
    
    # 2. ブラウザのWeb Speech APIを提案
    try:
        return transcribe_with_browser_api(content)
    except Exception as e:
        print(f"Browser API failed: {e}")
    
    # 3. スタブ実装（フォールバック）
    return transcribe_with_stub(content, chunk_seconds)


def transcribe_with_whisper_cpp(audio_data: bytes) -> List[Dict]:
    """Whisper.cppを使用"""
    whisper_exe = find_whisper_executable()
    if not whisper_exe:
        raise FileNotFoundError("Whisper.cpp not found")
    
    # 一時ファイルに保存
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
        temp_file.write(audio_data)
        temp_audio_path = temp_file.name
    
    try:
        # Whisper.cppを実行
        cmd = [
            whisper_exe,
            "-m", "models/ggml-base.bin",
            "-f", temp_audio_path,
            "-l", "ja",
            "-t", "0.0",
            "--output-json"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
            cwd=os.path.dirname(whisper_exe)
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Whisper.cpp failed: {result.stderr}")
        
        # JSON結果をパース
        result_data = json.loads(result.stdout)
        return parse_whisper_result(result_data)
        
    finally:
        os.unlink(temp_audio_path)


def transcribe_with_browser_api(audio_data: bytes) -> List[Dict]:
    """ブラウザのWeb Speech APIを使用（フロントエンド実装が必要）"""
    # これはフロントエンドで実装する必要があります
    # ここではスタブデータを返す
    return [
        {
            "text": "[Browser API] ブラウザの音声認識APIを使用してください",
            "start_sec": 0.0,
            "end_sec": 30.0,
            "speaker": None
        }
    ]


def transcribe_with_stub(audio_data: bytes, chunk_seconds: int) -> List[Dict]:
    """スタブ実装（開発用）"""
    # 音声データの長さを推定
    duration = estimate_audio_duration(audio_data)
    
    return [
        {
            "text": f"[スタブ] 音声認識のスタブ実装です。実際の音声認識にはWhisper.cppまたはブラウザAPIが必要です。",
            "start_sec": 0.0,
            "end_sec": duration,
            "speaker": None
        }
    ]


def estimate_audio_duration(audio_data: bytes) -> float:
    """音声データの長さを推定"""
    try:
        # WAVファイルの場合
        if audio_data[:4] == b'RIFF':
            with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
                temp_file.write(audio_data)
                temp_file.flush()
                
                with wave.open(temp_file.name, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    sample_rate = wav_file.getframerate()
                    duration = frames / float(sample_rate)
                    return duration
    except:
        pass
    
    # デフォルト値
    return 30.0


def find_whisper_executable() -> str:
    """Whisper.cppの実行ファイルを検索"""
    # 環境変数から
    whisper_path = os.getenv("WHISPER_EXECUTABLE_PATH")
    if whisper_path and os.path.exists(whisper_path):
        return whisper_path
    
    # 一般的な場所を検索
    possible_paths = [
        "./whisper-cpp/whisper.exe",
        "./whisper/whisper.exe",
        "./whisper.exe",
        "whisper.exe"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None


def parse_whisper_result(result: Dict[str, Any]) -> List[Dict]:
    """Whisper.cppの結果をパース"""
    chunks = []
    
    if "segments" in result:
        for segment in result["segments"]:
            chunk = {
                "text": segment.get("text", "").strip(),
                "start_sec": segment.get("start", 0.0),
                "end_sec": segment.get("end", 0.0),
                "speaker": None
            }
            chunks.append(chunk)
    else:
        chunk = {
            "text": result.get("text", "").strip(),
            "start_sec": 0.0,
            "end_sec": 0.0,
            "speaker": None
        }
        chunks.append(chunk)
    
    return chunks


# メインのASR関数を更新
def transcribe_audio(content: bytes, chunk_seconds: int = 30) -> List[Dict]:
    """メインのASR関数（無料版）"""
    return transcribe_audio_free(content, chunk_seconds)
