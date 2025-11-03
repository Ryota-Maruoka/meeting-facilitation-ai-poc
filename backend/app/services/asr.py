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


def combine_webm_chunks(chunk_files: list[str], output_path: str) -> str:
    """
    WebMチャンクファイルをFFmpegで正しく結合する
    
    確実な結合のため、以下の手順を実行：
    1. 各WebMチャンクをWAVに変換
    2. WAVファイルをconcatデマックスで結合（-c copyで高速）
    3. 結合したWAVをWebMに変換して出力
    
    Args:
        chunk_files: WebMチャンクファイルのパスのリスト
        output_path: 結合後の出力ファイルパス（WebM形式）
        
    Returns:
        結合されたファイルのパス
        
    Raises:
        RuntimeError: 結合に失敗した場合
    """
    import logging
    import subprocess
    import tempfile
    import shutil
    
    logger = logging.getLogger(__name__)
    
    if not chunk_files:
        raise ValueError("結合するチャンクファイルがありません")
    
    # チャンクファイルが1つの場合はコピーするだけ
    if len(chunk_files) == 1:
        shutil.copy2(chunk_files[0], output_path)
        logger.info(f"チャンクファイルが1つのため、コピー: {output_path}")
        return output_path
    
    # 一時ファイル用のディレクトリ
    temp_dir = tempfile.mkdtemp()
    wav_files = []
    concat_path = None
    
    try:
        # ステップ1: 各WebMチャンクをWAVに変換
        logger.info(f"ステップ1: WebMチャンクをWAVに変換開始（{len(chunk_files)}個）")
        for idx, chunk_file in enumerate(chunk_files):
            wav_path = os.path.join(temp_dir, f"chunk_{idx:04d}.wav")
            
            # WebM → WAV変換
            cmd_convert = [
                'ffmpeg',
                '-y',
                '-i', chunk_file,
                '-ar', '44100',      # サンプルレート
                '-ac', '2',          # ステレオ
                '-c:a', 'pcm_s16le', # 16-bit PCM
                '-f', 'wav',
                wav_path
            ]
            
            result = subprocess.run(
                cmd_convert,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=60,
                check=True
            )
            
            if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
                raise RuntimeError(f"チャンク{idx}のWAV変換に失敗: {wav_path}")
            
            wav_files.append(wav_path)
        
        # ステップ2: WAVファイルをconcatデマックスで結合
        logger.info(f"ステップ2: WAVファイルを結合開始（{len(wav_files)}個）")
        
        # concatファイルリストを作成
        concat_path = os.path.join(temp_dir, "concat_list.txt")
        with open(concat_path, 'w', encoding='utf-8') as concat_file:
            for wav_file in wav_files:
                # Windowsパスの場合、バックスラッシュをスラッシュに変換
                normalized_path = wav_file.replace('\\', '/')
                concat_file.write(f"file '{normalized_path}'\n")
        
        # 結合したWAVを一時ファイルとして作成
        combined_wav_path = os.path.join(temp_dir, "combined.wav")
        
        cmd_concat = [
            'ffmpeg',
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_path,
            '-c', 'copy',  # 再エンコードなし（高速・確実）
            combined_wav_path
        ]
        
        logger.info(f"WAV結合コマンド: {' '.join(cmd_concat)}")
        result = subprocess.run(
            cmd_concat,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300,
            check=True
        )
        
        if not os.path.exists(combined_wav_path) or os.path.getsize(combined_wav_path) == 0:
            raise RuntimeError(f"結合されたWAVファイルが生成されませんでした: {combined_wav_path}")
        
        combined_wav_size = os.path.getsize(combined_wav_path)
        logger.info(f"WAV結合完了: {combined_wav_size} bytes")
        
        # ステップ3: 結合したWAVをWebMに変換
        logger.info(f"ステップ3: 結合WAVをWebMに変換開始")
        
        cmd_webm = [
            'ffmpeg',
            '-y',
            '-i', combined_wav_path,
            '-c:a', 'libopus',  # Opusコーデック（WebM標準）
            '-b:a', '128k',     # ビットレート
            '-f', 'webm',       # 出力形式を明示
            output_path
        ]
        
        logger.info(f"WebM変換コマンド: {' '.join(cmd_webm)}")
        result = subprocess.run(
            cmd_webm,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300,
            check=True
        )
        
        # 最終ファイルを確認
        if not os.path.exists(output_path):
            raise RuntimeError(f"結合されたWebMファイルが生成されませんでした: {output_path}")
        
        output_file_size = os.path.getsize(output_path)
        if output_file_size == 0:
            raise RuntimeError(f"結合されたWebMファイルのサイズが0です: {output_path}")
        
        logger.info(f"WebMチャンク結合完了: {output_path}, ファイルサイズ={output_file_size} bytes")
        return output_path
        
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg処理エラー: {e}")
        logger.error(f"returncode: {e.returncode}")
        error_message = str(e)
        if e.stderr:
            try:
                stderr_snippet = e.stderr[-500:] if len(e.stderr) > 500 else e.stderr
                logger.error(f"stderr（最後の500文字）: {stderr_snippet}")
                error_message = stderr_snippet[-200:] if len(stderr_snippet) > 200 else stderr_snippet
            except (AttributeError, TypeError):
                error_message = str(e.stderr)
        if e.stdout:
            try:
                stdout_snippet = e.stdout[-500:] if len(e.stdout) > 500 else e.stdout
                logger.error(f"stdout（最後の500文字）: {stdout_snippet}")
            except (AttributeError, TypeError):
                pass
        raise RuntimeError(f"WebMチャンクの結合に失敗しました: {error_message}")
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg処理がタイムアウトしました")
        raise RuntimeError("WebMチャンクの結合がタイムアウトしました")
    except FileNotFoundError:
        logger.error("ffmpegが見つかりません")
        raise RuntimeError("ffmpeg is required for audio chunk combination. Please install ffmpeg.")
    finally:
        # 一時ディレクトリを削除
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as cleanup_error:
            logger.warning(f"一時ディレクトリの削除に失敗: {cleanup_error}")


def convert_webm_to_format(webm_file_path: str, output_format: str = "mp3") -> str:
    """
    WebM形式の音声ファイルを指定形式に変換する
    
    Args:
        webm_file_path: WebM音声ファイルのパス
        output_format: 出力形式（"mp3", "wav", "webm"など）
        
    Returns:
        変換後の音声ファイルのパス（一時ファイル）
        
    Raises:
        RuntimeError: 変換に失敗した場合
        ValueError: サポートされていない形式が指定された場合
    """
    import logging
    import subprocess
    import tempfile
    
    logger = logging.getLogger(__name__)
    
    # サポートされている形式
    supported_formats = ["mp3", "wav", "webm"]
    if output_format.lower() not in supported_formats:
        raise ValueError(f"サポートされていない形式: {output_format} (対応形式: {', '.join(supported_formats)})")
    
    # WebM形式の場合は変換不要
    if output_format.lower() == "webm":
        return webm_file_path
    
    # 一時出力ファイルを作成
    output_file = tempfile.NamedTemporaryFile(suffix=f'.{output_format}', delete=False)
    output_path = output_file.name
    output_file.close()
    
    try:
        # FFmpegコマンドを構築
        cmd = [
            'ffmpeg',
            '-y',  # 上書き確認なし
            '-i', webm_file_path,  # 入力ファイル
        ]
        
        # 出力形式に応じてパラメータを設定
        if output_format.lower() == "mp3":
            # MP3: 128kbps, 44.1kHz, ステレオ（一般的な設定）
            # 互換性を重視したシンプルな設定
            cmd.extend([
                '-codec:a', 'libmp3lame',
                '-b:a', '128k',  # ビットレート
                '-ar', '44100',  # サンプルレート
                '-ac', '2',      # ステレオ
            ])
        elif output_format.lower() == "wav":
            # WAV: 44.1kHz, ステレオ, 16-bit PCM（高品質・互換性重視）
            cmd.extend([
                '-ar', '44100',      # サンプルレート
                '-ac', '2',          # ステレオ
                '-c:a', 'pcm_s16le', # 16-bit PCM（無圧縮）
            ])
        
        cmd.append(output_path)
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300,  # 5分タイムアウト（長時間の録音に対応）
            check=True
        )
        
        # 変換後のファイルが存在し、サイズが0でないことを確認
        if not os.path.exists(output_path):
            logger.error(f"変換されたファイルが存在しません: {output_path}")
            if result.stderr:
                logger.error(f"FFmpeg stderr（全体）: {result.stderr}")
            raise RuntimeError(f"変換されたファイルが生成されませんでした: {output_path}")
        
        output_file_size = os.path.getsize(output_path)
        if output_file_size == 0:
            logger.error(f"変換されたファイルのサイズが0です: {output_path}")
            if result.stderr:
                logger.error(f"FFmpeg stderr（全体）: {result.stderr}")
            raise RuntimeError(f"変換されたファイルのサイズが0です: {output_path}")
        
        logger.info(f"音声変換完了: {output_path} ({output_format}), ファイルサイズ={output_file_size} bytes")
        return output_path
        
    except subprocess.CalledProcessError as e:
        # エラーメッセージを安全に取得
        error_msg = f"returncode: {e.returncode}"
        try:
            if e.stderr:
                stderr_snippet = e.stderr[:500] if len(e.stderr) > 500 else e.stderr
                logger.error(f"FFmpeg変換エラー: {error_msg}")
                logger.error(f"stderr: {stderr_snippet}")
            else:
                logger.error(f"FFmpeg変換エラー: {error_msg}")
        except (AttributeError, TypeError, UnicodeEncodeError) as err:
            # エンコーディングエラーが発生した場合は、エラーメッセージを安全に処理
            logger.error(f"FFmpeg変換エラー: {error_msg}")
            logger.error(f"エラーメッセージの取得に失敗: {err}")
        
        # 一時ファイルを削除
        if os.path.exists(output_path):
            try:
                os.unlink(output_path)
            except Exception:
                pass
        
        raise RuntimeError(f"音声形式の変換に失敗しました: {output_format}")
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg変換がタイムアウトしました")
        # 一時ファイルを削除
        if os.path.exists(output_path):
            try:
                os.unlink(output_path)
            except Exception:
                pass
        raise RuntimeError("音声変換がタイムアウトしました")
    except FileNotFoundError:
        logger.error("ffmpegが見つかりません。ffmpegのインストールが必要です")
        raise RuntimeError("ffmpeg is required for audio conversion. Please install ffmpeg.")


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
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=30,  # 30秒タイムアウト
                check=True
            )

            # WAVファイルを読み込み
            with open(wav_path, 'rb') as f:
                wav_data = f.read()

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
        _whisper_model = whisper.load_model("tiny")

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

        # 音声品質チェック（無音判定）
        is_valid, audio_info = _check_audio_quality(audio_file_path)
        
        if not is_valid:
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
        try:
            result = model.transcribe(
                audio_np,
                language="ja",
                fp16=False,  # Windows CPU環境ではfp16を無効化
                verbose=False,
            )
        except Exception as e:
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

        # メモリを解放
        import gc
        del audio_np
        del result
        gc.collect()

        # PyTorchのキャッシュもクリア
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return {
            "text": filtered_text,
            "language": "ja",
        }

    except ImportError as e:
        logger.error("Python版Whisperがインストールされていません。pip install openai-whisper を実行してください")
        raise RuntimeError("openai-whisper is not installed. Run: pip install openai-whisper")
    except Exception as e:
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
                    with open(audio_file_path, 'rb') as f:
                        webm_data = f.read()

                    wav_data = convert_webm_to_wav(webm_data)

                    # 一時WAVファイルとして保存
                    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                        temp_wav.write(wav_data)
                        temp_wav_path = temp_wav.name
                        processed_audio_path = temp_wav_path

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
                    with open(audio_file_path, 'rb') as f:
                        webm_data = f.read()

                    wav_data = convert_webm_to_wav(webm_data)

                    # 一時WAVファイルとして保存
                    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                        temp_wav.write(wav_data)
                        temp_wav_path = temp_wav.name
                        processed_audio_path = temp_wav_path

                # Python Whisperで文字起こし実行（Azure Whisperと同じロジック）
                result = await transcribe_with_python_whisper(processed_audio_path)

                # 一時ファイルをクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
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