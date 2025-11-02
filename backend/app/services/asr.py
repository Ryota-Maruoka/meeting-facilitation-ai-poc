"""
ASR (Automatic Speech Recognition) サービス

無料の音声認識機能の実装
"""

import os
import re
import subprocess
import tempfile
from typing import List, Dict, Any, Tuple
import logging
import numpy as np
import wave

logger = logging.getLogger(__name__)


def _check_audio_quality(audio_file_path: str) -> Tuple[bool, Dict[str, Any]]:
    """
    音声ファイルの品質をチェック（無音判定用）
    
    Args:
        audio_file_path: 音声ファイルのパス（WAV形式）
        
    Returns:
        (is_valid, audio_info): 
        - is_valid: 音声データが有効か（無音でない）
        - audio_info: 音声情報（file_size, duration, bytes_per_second, rms）
    """
    try:
        # ファイルサイズを取得
        file_size = os.path.getsize(audio_file_path)
        
        # WAVファイルを読み込み
        with wave.open(audio_file_path, 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            audio_data = wav_file.readframes(n_frames)
            
            # 音声の長さ（秒）を計算
            audio_duration_seconds = n_frames / sample_rate if sample_rate > 0 else 0.0
            
            # RMS（音量レベル）を計算
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(audio_np ** 2))
            
            # 1秒あたりのファイルサイズ（bytes/秒）
            bytes_per_second = file_size / audio_duration_seconds if audio_duration_seconds > 0 else 0
            
            audio_info = {
                "file_size": file_size,
                "duration": audio_duration_seconds,
                "bytes_per_second": bytes_per_second,
                "rms": rms,
                "sample_rate": sample_rate,
            }
            
            # 無音判定の閾値
            MIN_BYTES_PER_SECOND = 0.8 * 1024  # 0.8KB/秒（正常な音声の下限）
            MIN_RMS_THRESHOLD = 0.015  # RMS < 0.015 はほぼ無音
            
            # 無音判定
            is_valid = (
                bytes_per_second >= MIN_BYTES_PER_SECOND and 
                rms >= MIN_RMS_THRESHOLD
            )
            
            logger.info(
                f">>> 音声品質チェック: "
                f"ファイルサイズ={file_size} bytes, "
                f"音声長={audio_duration_seconds:.2f}秒, "
                f"比率={bytes_per_second:.1f} bytes/秒, "
                f"RMS={rms:.6f}, "
                f"有効={'Yes' if is_valid else 'No (無音)'}"
            )
            
            return is_valid, audio_info
            
    except Exception as e:
        logger.warning(f"音声品質チェックエラー: {e}")
        # エラーの場合は有効として扱う（判定できない場合は後続処理に任せる）
        return True, {
            "file_size": 0,
            "duration": 0.0,
            "bytes_per_second": 0.0,
            "rms": 0.0,
            "sample_rate": 0,
        }


def _filter_hallucination_text(text: str, is_weakly_silence: bool = False) -> str:
    """
    幻聴テキストをフィルタリング
    
    Args:
        text: 文字起こし結果テキスト
        is_weakly_silence: 緩やかな無音判定（Trueの場合、より厳しくフィルタリング）
        
    Returns:
        フィルタリング後のテキスト（幻聴と判定された場合は空文字列）
    """
    if not text:
        return ""
    
    # 日本語文字（ひらがな、カタカナ、漢字）の割合をチェック
    japanese_chars = re.findall(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', text)
    total_chars = len(re.findall(r'[^\s]', text))  # 空白以外の文字数
    japanese_ratio = len(japanese_chars) / total_chars if total_chars > 0 else 0
    
    logger.info(
        f">>> テキスト品質チェック: "
        f"日本語文字数={len(japanese_chars)}, "
        f"総文字数={total_chars}, "
        f"日本語割合={japanese_ratio:.2%}"
    )
    
    # 日本語の割合が20%未満の場合は除外（明らかに日本語ではない）
    if total_chars > 5 and japanese_ratio < 0.2:
        logger.info(f">>> 日本語の割合が低すぎます（{japanese_ratio:.2%} < 20%）、無視します")
        return ""
    
    # 明らかに不正なパターンのみ検出（最小限）
    hallucination_patterns = [
        r'ご視聴.*?ありがとう',
        r'Thanks?\s+for\s+watching',
        r'让我们来看看',
        r'視聴.*?感謝',
        r'ご.*?視聴.*?ございました',
    ]
    
    for pattern in hallucination_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            logger.info(f">>> 幻聴パターンを検出 ({pattern}), 無視します: {text[:100]}")
            return ""
    
    return text


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
        
        # データサイズをチェック
        if len(webm_data) < 100:  # 最小限のヘッダサイズ
            raise ValueError(f"WebMデータが小さすぎます: {len(webm_data)} bytes")
        
        # WebMファイルのマジックナンバーをチェック（EBML header: 0x1A45DFA3）
        # 実際には先頭数バイトに0x1Aが含まれることが多い
        if webm_data[0:4] not in [b'\x1a\x45\xdf\xa3', b'\x00\x00\x00\x00']:
            # 簡易的なチェック: 最初の100バイトに "webm" または "matroska" の文字列があるか
            header = webm_data[:100].lower()
            if b'webm' not in header and b'matroska' not in header:
                logger.warning("WebMファイルのヘッダが不正な可能性があります")
        
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            temp_webm.write(webm_data)
            temp_webm.flush()
            webm_path = temp_webm.name
        
        # WAV出力パス
        wav_path = webm_path.replace('.webm', '.wav')
        
        try:
            # ffmpegでWebM → WAV変換（16kHz mono PCM）
            # -f webm を追加して形式を明示的に指定
            cmd = [
                'ffmpeg',
                '-y',  # 上書き確認なし
                '-f', 'webm',  # 入力形式を明示
                '-i', webm_path,  # 入力ファイル
                '-ar', '16000',   # サンプルレート16kHz
                '-ac', '1',       # モノラル
                '-c:a', 'pcm_s16le',  # 16-bit PCM
                '-f', 'wav',      # 出力形式を明示
                wav_path
            ]
            
            logger.info(f">>> ffmpeg変換開始: {' '.join(cmd)}")
            logger.info(f">>> WebMデータサイズ: {len(webm_data)} bytes")
            logger.info(f">>> WebMファイルパス: {webm_path}")
            logger.info(f">>> WAV出力パス: {wav_path}")

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30,  # 30秒タイムアウト
                check=True
            )

            logger.info(f">>> ffmpeg stdout: {result.stdout[:500] if result.stdout else '(empty)'}")
            logger.info(f">>> ffmpeg stderr: {result.stderr[:500] if result.stderr else '(empty)'}")

            # WAVファイルを読み込み
            with open(wav_path, 'rb') as f:
                wav_data = f.read()

            logger.info(f">>> ffmpeg変換完了: WebM -> WAV (16kHz mono, {len(wav_data)} bytes)")
            return wav_data
            
        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg変換エラー: {e}")
            logger.error(f"returncode: {e.returncode}")
            logger.error(f"stderr: {e.stderr}")
            logger.error(f"stdout: {e.stdout}")
            
            # エラーメッセージを解析してユーザーフレンドリーなメッセージを生成
            stderr_lower = e.stderr.lower() if e.stderr else ""
            if "invalid data" in stderr_lower or "ebml" in stderr_lower:
                raise RuntimeError(
                    "音声データが破損しているか、無効なWebM形式です。"
                    "マイクが正常に動作しているか確認してください。"
                )
            elif "no audio" in stderr_lower:
                raise RuntimeError("音声ストリームが見つかりません。マイクが有効か確認してください。")
            else:
                raise RuntimeError(f"音声形式の変換に失敗しました: {e.stderr[:200]}")
                
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

# グローバル変数でWhisperモデルをキャッシュ
_whisper_model = None
_whisper_model_lock = None

def _get_whisper_model():
    """Whisperモデルを取得（初回のみロード、以降はキャッシュを使用）"""
    global _whisper_model

    if _whisper_model is None:
        import whisper
        print(">>> Whisperモデルを初回ロード中...")
        _whisper_model = whisper.load_model("tiny")
        print(">>> Whisperモデルのロード完了")

    return _whisper_model


async def transcribe_with_python_whisper(audio_file_path: str) -> Dict[str, Any]:
    """
    Python版Whisperを使用した音声認識

    Args:
        audio_file_path: 音声ファイルのパス

    Returns:
        文字起こし結果
    """
    try:
        import torch

        print(">>> Python版Whisperで文字起こし中...")
        logger.info(">>> Python版Whisperで文字起こしを実行")

        # 音声品質チェック（無音判定）
        is_valid, audio_info = _check_audio_quality(audio_file_path)
        
        if not is_valid:
            logger.info(">>> 音声データが無音と判定されました（Python Whisperに送信せずスキップ）")
            return {
                "text": "",
                "language": "ja",
            }

        # キャッシュされたモデルを取得
        model = _get_whisper_model()

        # WAVファイルを直接NumPy配列として読み込み
        import numpy as np
        import wave

        with wave.open(audio_file_path, 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            audio_data = wav_file.readframes(n_frames)
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        # 音声ファイルを文字起こし
        print(f">>> Whisper実行開始（音声長: {audio_info['duration']:.2f}秒）")
        try:
            result = model.transcribe(
                audio_np,
                language="ja",
                fp16=False,  # Windows CPU環境ではfp16を無効化
                verbose=False,
            )
            print(">>> Whisper実行完了")
        except Exception as e:
            print(f">>> Whisper実行中にエラー: {e}")
            raise

        text = result["text"].strip()
        
        # テキストの幻聴フィルタリング
        # 緩やかな無音判定（bytes/秒またはRMSが低めの場合）
        is_weakly_silence = (
            audio_info["bytes_per_second"] < 1.0 * 1024 or 
            audio_info["rms"] < 0.02
        )
        
        filtered_text = _filter_hallucination_text(
            text,
            is_weakly_silence=is_weakly_silence
        )
        
        print(f">>> Whisper文字起こし結果: {filtered_text[:200] if filtered_text else '(empty)'}")
        logger.info(f">>> Whisper文字起こし結果: {filtered_text[:200] if filtered_text else '(empty)'}")

        # メモリを解放
        import gc
        del audio_np
        del result
        gc.collect()

        # PyTorchのキャッシュもクリア
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        print(">>> メモリ解放完了")

        return {
            "text": filtered_text,
            "language": "ja",
        }

    except ImportError as e:
        print(f">>> ImportError: {e}")
        logger.error("Python版Whisperがインストールされていません。pip install openai-whisper を実行してください")
        raise RuntimeError("openai-whisper is not installed. Run: pip install openai-whisper")
    except Exception as e:
        print(f">>> Python版Whisper文字起こしエラー: {e}")
        print(f">>> エラー詳細: {type(e).__name__}")
        import traceback
        print(traceback.format_exc())
        logger.error(f"Python版Whisper文字起こしエラー: {e}", exc_info=True)
        raise


async def transcribe_audio_file(audio_file_path: str) -> Dict[str, Any]:
    """
    音声ファイルを文字起こしする（Python版Whisper使用）
    
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
        
        # Azure OpenAI Whisperを使用する場合
        if settings.asr_provider == "azure_whisper":
            logger.info("Azure OpenAI Whisper APIを使用して文字起こしを実行")
            
            from .azure_whisper_service import transcribe_with_azure_whisper
            
            try:
                # WebMファイルの場合は先にWAVに変換
                processed_audio_path = audio_file_path
                temp_wav_path = None

                if audio_file_path.lower().endswith('.webm'):
                    print(">>> WebMファイルをWAVに変換してからAzure Whisperに渡します")
                    with open(audio_file_path, 'rb') as f:
                        webm_data = f.read()

                    wav_data = convert_webm_to_wav(webm_data)

                    # 一時WAVファイルとして保存
                    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                        temp_wav.write(wav_data)
                        temp_wav_path = temp_wav.name
                        processed_audio_path = temp_wav_path

                    print(f">>> WAV変換完了: {processed_audio_path}")

                # 音声品質チェック（無音判定）
                is_valid, audio_info = _check_audio_quality(processed_audio_path)
                
                if not is_valid:
                    logger.info(">>> 音声データが無音と判定されました（Azure Whisperに送信せずスキップ）")
                    # 一時ファイルをクリーンアップ
                    if temp_wav_path and os.path.exists(temp_wav_path):
                        try:
                            os.unlink(temp_wav_path)
                        except Exception:
                            pass
                    return {
                        "text": "",
                        "language": "ja",
                    }

                # Azure Whisperで文字起こし実行
                result = await transcribe_with_azure_whisper(processed_audio_path)
                
                # テキストの幻聴フィルタリング
                # 緩やかな無音判定（bytes/秒またはRMSが低めの場合）
                is_weakly_silence = (
                    audio_info["bytes_per_second"] < 1.0 * 1024 or 
                    audio_info["rms"] < 0.02
                )
                
                filtered_text = _filter_hallucination_text(
                    result.get("text", ""), 
                    is_weakly_silence=is_weakly_silence
                )
                
                # フィルタリング後のテキストを反映
                result["text"] = filtered_text
                
                # 一時ファイルをクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
                        print(f">>> 一時WAVファイルを削除: {temp_wav_path}")
                    except Exception as e:
                        logger.warning(f"一時ファイル削除エラー: {e}")

                return result

            except Exception as e:
                # Azure Whisperが失敗した場合のクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
                    except:
                        pass
                
                logger.error(f"Azure OpenAI Whisper文字起こしエラー: {e}")
                raise

        # Python版Whisperを使用する場合
        elif settings.asr_provider == "whisper_python":
            logger.info("Python版Whisperを使用して文字起こしを実行")

            try:
                # WebMファイルの場合は先にWAVに変換
                processed_audio_path = audio_file_path
                temp_wav_path = None

                if audio_file_path.lower().endswith('.webm'):
                    print(">>> WebMファイルをWAVに変換してからWhisperに渡します")
                    with open(audio_file_path, 'rb') as f:
                        webm_data = f.read()

                    wav_data = convert_webm_to_wav(webm_data)

                    # 一時WAVファイルとして保存
                    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                        temp_wav.write(wav_data)
                        temp_wav_path = temp_wav.name
                        processed_audio_path = temp_wav_path

                    print(f">>> WAV変換完了: {processed_audio_path}")

                # Python Whisperで文字起こし実行（Azure Whisperと同じロジック）
                result = await transcribe_with_python_whisper(processed_audio_path)

                # 一時ファイルをクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
                        print(f">>> 一時WAVファイルを削除: {temp_wav_path}")
                    except Exception as e:
                        logger.warning(f"一時ファイル削除エラー: {e}")

                return result

            except Exception as e:
                # Python版Whisperが失敗した場合のクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
                    except:
                        pass
                
                # Python版Whisperが失敗した場合はエラーを返す
                print(f">>> Python版Whisperが失敗: {e}")
                logger.error(f"Python版Whisperが失敗: {e}")
                raise RuntimeError(f"音声認識に失敗しました: {str(e)}")
        
        # asr_providerが未対応の場合
        logger.error(f"未対応のASRプロバイダー: {settings.asr_provider}")
        raise ValueError(f"未対応のASRプロバイダー: {settings.asr_provider}")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"ASR error: {e}", exc_info=True)
        # エラーを上位に伝播
        raise