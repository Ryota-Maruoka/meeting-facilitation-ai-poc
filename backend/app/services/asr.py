"""
ASR (Automatic Speech Recognition) サービス

無料の音声認識機能の実装
"""

import os
import io
import subprocess
import tempfile
import json
import random
from typing import List, Dict, Any
from pathlib import Path


def convert_webm_to_wav(webm_data: bytes) -> bytes:
    """
    WebM形式の音声データをWAV（16kHz mono PCM）に変換
    
    Args:
        webm_data: WebM形式の音声バイナリデータ
        
    Returns:
        WAV形式の音声バイナリデータ
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            temp_webm.write(webm_data)
            temp_webm.flush()
            webm_path = temp_webm.name
        
        # WAV出力パス
        wav_path = webm_path.replace('.webm', '.wav')
        
        try:
            # ffmpegでWebM → WAV変換（16kHz mono PCM）
            cmd = [
                'ffmpeg',
                '-y',  # 上書き確認なし
                '-i', webm_path,  # 入力ファイル
                '-ar', '16000',   # サンプルレート16kHz
                '-ac', '1',       # モノラル
                '-c:a', 'pcm_s16le',  # 16-bit PCM
                wav_path
            ]
            
            logger.info(f"ffmpeg変換開始: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30,  # 30秒タイムアウト
                check=True
            )
            
            # WAVファイルを読み込み
            with open(wav_path, 'rb') as f:
                wav_data = f.read()
            
            logger.info(f"ffmpeg変換完了: WebM -> WAV (16kHz mono, {len(wav_data)} bytes)")
            return wav_data
            
        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg変換エラー: {e}")
            logger.error(f"stderr: {e.stderr}")
            raise RuntimeError(f"ffmpeg conversion failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            logger.error("ffmpeg変換がタイムアウトしました")
            raise RuntimeError("ffmpeg conversion timeout")
        except FileNotFoundError:
            logger.error("ffmpegが見つかりません。ffmpegのインストールが必要です")
            raise RuntimeError("ffmpeg is required for audio conversion. Please install ffmpeg.")
        finally:
            # 一時ファイルをクリーンアップ
            try:
                if os.path.exists(webm_path):
                    os.unlink(webm_path)
                if os.path.exists(wav_path):
                    os.unlink(wav_path)
            except Exception as cleanup_error:
                logger.warning(f"一時ファイルのクリーンアップに失敗: {cleanup_error}")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"音声変換エラー: {e}")
        raise RuntimeError(f"Failed to convert WebM to WAV: {e}")


def transcribe_audio(content: bytes, chunk_seconds: int = 30) -> List[Dict]:
    """
    音声データを文字起こしする（無料版）
    
    Args:
        content: 音声バイナリデータ
        chunk_seconds: チャンクの秒数（デフォルト30秒）
        
    Returns:
        文字起こしチャンクのリスト
    """
    try:
        # 無料のWhisper.cppを使用
        return transcribe_with_whisper_cpp(content)
        
    except Exception as e:
        print(f"ASR error: {e}")
        # エラー時はスタブデータを返す
        return [
            {
                "text": "[ASR placeholder] 会議音声のサンプルです。JWT検討について話しています。",
                "start_sec": 0.0,
                "end_sec": float(chunk_seconds),
                "speaker": None
            }
        ]


def transcribe_with_whisper_cpp(audio_data: bytes) -> List[Dict]:
    """
    Whisper.cppを使用した音声認識（無料）
    
    Args:
        audio_data: 音声バイナリデータ
        
    Returns:
        文字起こしチャンクのリスト
    """
    try:
        # 一時ファイルに音声データを保存
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_audio_path = temp_file.name
        
        # Whisper.cppの実行（Windows版）
        whisper_exe = find_whisper_executable()
        if not whisper_exe:
            raise FileNotFoundError("Whisper.cpp executable not found")
        
        # 一時JSONファイルを作成
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as temp_json:
            temp_json_path = temp_json.name
        
        # 設定からモデルパスを取得
        from ..settings import settings
        model_path = settings.whisper_model_path
        
        # Whisper.cppを実行
        cmd = [
            whisper_exe,
            "-m", model_path,  # モデルファイル
            "-f", temp_audio_path,
            "-l", "ja",  # 日本語
            "-t", "0.0",  # 温度
            "--output-json",
            "--output-file", temp_json_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5分タイムアウト
            cwd=os.path.dirname(whisper_exe)  # Whisper.cppのディレクトリで実行
        )
        
        if result.returncode != 0:
            print(f"Whisper.cpp error: {result.stderr}")
            raise RuntimeError(f"Whisper.cpp failed: {result.stderr}")
        
        # JSON結果を読み込み
        with open(temp_json_path, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        # 一時ファイルを削除
        os.unlink(temp_audio_path)
        os.unlink(temp_json_path)
        
        # 結果をパース
        return parse_whisper_result(result_data)
        
    except Exception as e:
        print(f"Whisper.cpp error: {e}")
        # フォールバック: スタブデータを返す
    return [
            {
                "text": "[ASR placeholder] 会議音声のサンプルです。JWT検討について話しています。",
                "start_sec": 0.0,
                "end_sec": 30.0,
                "speaker": None
            }
        ]


def find_whisper_executable() -> str:
    """
    Whisper.cppの実行ファイルを検索
    
    Returns:
        実行ファイルのパス（見つからない場合はNone）
    """
    from ..settings import settings
    
    # 設定からパスを取得
    whisper_path = settings.whisper_executable_path
    if whisper_path and os.path.exists(whisper_path):
        return whisper_path
    
    # 一般的な場所を検索
    possible_paths = [
        "./main.exe",  # backendディレクトリ直下
        "./whisper-cpp/main.exe",
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
            chunk = {
                "text": segment.get("text", "").strip(),
                "start_sec": segment.get("start", 0.0),
                "end_sec": segment.get("end", 0.0),
                "speaker": None  # Whisper.cppは話者分離しない
            }
            chunks.append(chunk)
    else:
        # セグメント情報がない場合は全体を1つのチャンクとして扱う
        chunk = {
            "text": result.get("text", "").strip(),
            "start_sec": 0.0,
            "end_sec": 0.0,
            "speaker": None
        }
        chunks.append(chunk)
    
    return chunks


async def transcribe_audio_file(audio_file_path: str) -> Dict[str, Any]:
    """
    音声ファイルを文字起こしする（Whisper.cpp使用）
    
    Args:
        audio_file_path: 音声ファイルのパス
        
    Returns:
        文字起こし結果（テキスト、信頼度等）
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # 設定を確認
        from ..settings import settings
        
        # スタブ実装の場合はスタブデータを返す
        if settings.asr_provider == "stub":
            logger.info("スタブ実装を使用して文字起こしを実行")
            return {
                "text": "こんにちは、会議の文字起こしテストです。音声認識が正常に動作しています。",
                "confidence": 0.95,
                "language": "ja"
            }
        
        # ファイルサイズをチェック
        file_size = os.path.getsize(audio_file_path)
        logger.info(f"文字起こし開始: {audio_file_path} ({file_size} bytes)")
        
        if file_size < 1000:  # 1KB未満は無効なファイル
            return {
                "text": "音声ファイルが小さすぎます",
                "confidence": 0.0,
                "language": "ja"
            }
        
        # 音声ファイルの形式を確認し、必要に応じて変換
        processed_audio_path = audio_file_path
        
        # WebMファイルの場合はWAVに変換
        if audio_file_path.lower().endswith('.webm'):
            logger.info("WebMファイルを検出、WAVに変換中...")
            try:
                with open(audio_file_path, 'rb') as f:
                    webm_data = f.read()
                
                wav_data = convert_webm_to_wav(webm_data)
                
                # 変換されたWAVファイルを一時ファイルとして保存
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                    temp_wav.write(wav_data)
                    processed_audio_path = temp_wav.name
                
                logger.info(f"WebM変換完了: {processed_audio_path}")
                
            except Exception as e:
                logger.error(f"WebM変換エラー: {e}")
                return {
                    "text": f"[エラー] 音声ファイルの変換に失敗しました: {str(e)}",
                    "confidence": 0.0,
                    "language": "ja"
                }
        
        # Whisper.cppの実行ファイルを検索
        whisper_exe = find_whisper_executable()
        if not whisper_exe:
            logger.error("Whisper.cppの実行ファイルが見つかりません")
            raise FileNotFoundError("Whisper.cpp executable not found")
        
        logger.info(f"Whisper.cpp実行ファイル: {whisper_exe}")
        
        # 設定からモデルパスを取得
        from ..settings import settings
        model_path = settings.whisper_model_path
        
        if not os.path.exists(model_path):
            logger.error(f"モデルファイルが見つかりません: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        logger.info(f"モデルファイル: {model_path}")
        
        # Whisper.cppを実行（標準出力からテキストを取得）
        cmd = [
            whisper_exe,
            "-m", model_path,  # モデルファイル
            "-f", processed_audio_path,  # 入力ファイル（変換済み）
            "-l", settings.asr_language,  # 言語
            "-t", str(int(settings.asr_temperature)),  # 温度（整数）
            "-nt",  # テキストのみ出力（タイムスタンプなし）
        ]
        
        logger.info(f"Whisper.cppコマンド: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,  # 60秒タイムアウト
            cwd=os.path.dirname(os.path.abspath(whisper_exe))
        )
        
        if result.returncode != 0:
            logger.error(f"Whisper.cppエラー (returncode={result.returncode})")
            logger.error(f"stderr: {result.stderr}")
            logger.error(f"stdout: {result.stdout}")
            raise RuntimeError(f"Whisper.cpp failed: {result.stderr}")
        
        logger.info("Whisper.cpp実行成功")
        
        # 標準出力からテキストを取得
        text = result.stdout.strip()
        
        # 空の場合はstderrも確認（Whisper.cppはstderrに出力する場合がある）
        if not text and result.stderr:
            # stderrから [BLANK_AUDIO] などのマーカーを除外してテキストを抽出
            lines = result.stderr.split('\n')
            for line in lines:
                # タイムスタンプ付きの文字起こし行を探す
                # 例: [00:00:00.000 --> 00:00:05.000]  こんにちは
                if '-->' in line and ']' in line:
                    # タイムスタンプの後のテキストを抽出
                    text_part = line.split(']', 1)[-1].strip()
                    if text_part and not text_part.startswith('['):
                        text += text_part + " "
        
        text = text.strip()
        
        # テキストが空の場合
        if not text:
            logger.warning("文字起こし結果が空です（無音または認識不可）")
            return {
                "text": "",  # 空の文字列を返す
                "confidence": 0.0,
                "language": settings.asr_language
            }
        
        logger.info(f"文字起こし結果: {text[:100] if len(text) > 100 else text}")
        
        # 一時ファイルをクリーンアップ
        if processed_audio_path != audio_file_path and os.path.exists(processed_audio_path):
            try:
                os.unlink(processed_audio_path)
                logger.info("一時ファイルを削除しました")
            except Exception as e:
                logger.warning(f"一時ファイルの削除に失敗: {e}")
        
        return {
            "text": text,
            "confidence": 0.95,  # Whisper.cppは信頼度を返さないため固定値
            "language": settings.asr_language
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"ASR error: {e}", exc_info=True)
        
        # エラー時はスタブデータを返す
        return {
            "text": f"[エラー] 音声認識に失敗しました: {str(e)}",
            "confidence": 0.0,
            "language": "ja"
        }
