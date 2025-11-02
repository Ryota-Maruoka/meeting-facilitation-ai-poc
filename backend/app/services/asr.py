"""
ASR (Automatic Speech Recognition) サービス

無料の音声認識機能の実装
"""

import os
import subprocess
import tempfile
from typing import List, Dict, Any


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


# Whisper.cpp関連の関数は削除済み
# Python版Whisperのみを使用


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
        import logging
        logger = logging.getLogger(__name__)

        print(">>> Python版Whisperで文字起こし中...")
        logger.info(">>> Python版Whisperで文字起こし中...")

        import torch
        import numpy as np
        import wave

        # キャッシュされたモデルを取得
        model = _get_whisper_model()

        # WAVファイルを直接NumPy配列として読み込み（ffmpegを使わない）
        with wave.open(audio_file_path, 'rb') as wav_file:
            # WAVファイルのパラメータを取得
            sample_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            audio_data = wav_file.readframes(n_frames)

            # バイトデータをNumPy配列に変換
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

            print(f">>> 音声データ読み込み完了: {len(audio_np)} samples, {sample_rate}Hz")

        # 音声ファイルを文字起こし
        print(f">>> Whisper実行開始（音声長: {len(audio_np)/16000:.2f}秒）")
        try:
            result = model.transcribe(
                audio_np,  # NumPy配列を直接渡す
                language="ja",  # 日本語
                fp16=False,  # Windows CPU環境ではfp16を無効化
                verbose=False,  # 詳細ログを抑制
            )
            print(">>> Whisper実行完了")
        except Exception as e:
            print(f">>> Whisper実行中にエラー: {e}")
            raise

        text = result["text"].strip()

        print(f">>> Whisper文字起こし結果: {text[:200] if text else '(empty)'}")
        logger.info(f">>> Whisper文字起こし結果: {text[:200] if text else '(empty)'}")

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
            "text": text,
            "confidence": 0.95,
            "language": "ja"
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

                result = await transcribe_with_azure_whisper(processed_audio_path)

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