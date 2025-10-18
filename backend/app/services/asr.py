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
        
        print(f"Whisper.cpp return code: {result.returncode}")
        print(f"Whisper.cpp stdout: {result.stdout}")
        print(f"Whisper.cpp stderr: {result.stderr}")
        
        if result.returncode != 0:
            print(f"Whisper.cpp error: {result.stderr}")
            raise RuntimeError(f"Whisper.cpp failed: {result.stderr}")
        
        # JSON結果を読み込み
        with open(temp_json_path, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        print(f"Whisper.cpp JSON result: {result_data}")
        
        # 一時ファイルを削除
        os.unlink(temp_audio_path)
        os.unlink(temp_json_path)
        
        # 結果をパース
        parsed_result = parse_whisper_result(result_data)
        print(f"Parsed result: {parsed_result}")
        return parsed_result
        
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

        # Python版Whisperを使用する場合
        if settings.asr_provider == "whisper_python":
            logger.info("Python版Whisperを使用して文字起こしを実行")

            # WebMファイルの場合は先にWAVに変換
            processed_audio_path = audio_file_path
            temp_wav_path = None

            try:
                if audio_file_path.lower().endswith('.webm'):
                    print(">>> WebMファイルをWAVに変換してからWhisperに渡します")
                    with open(audio_file_path, 'rb') as f:
                        webm_data = f.read()

                    wav_data = convert_webm_to_wav(webm_data)

                    # 一時WAVファイルとして保存
                    import tempfile
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
                # エラー時も一時ファイルをクリーンアップ
                if temp_wav_path and os.path.exists(temp_wav_path):
                    try:
                        os.unlink(temp_wav_path)
                    except:
                        pass
                raise
        
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
            print("=" * 80)
            print(">>> WebMファイルを検出、WAVに変換中...")
            logger.info(">>> WebMファイルを検出、WAVに変換中...")
            try:
                with open(audio_file_path, 'rb') as f:
                    webm_data = f.read()

                print(f">>> WebMデータ読み込み: {len(webm_data)} bytes")
                print(f">>> WebMヘッダ(最初の50バイト): {webm_data[:50].hex()}")
                logger.info(f">>> WebMデータ読み込み: {len(webm_data)} bytes")
                logger.info(f">>> WebMヘッダ(最初の50バイト): {webm_data[:50].hex()}")

                wav_data = convert_webm_to_wav(webm_data)

                print(f">>> WAV変換完了: {len(wav_data)} bytes")
                logger.info(f">>> WAV変換完了: {len(wav_data)} bytes")

                # WAVファイルの音声レベルをチェック（無音検出）
                if len(wav_data) < 1000:
                    logger.warning(">>> WAVファイルが小さすぎます（おそらく無音）")
                    return {
                        "text": "",
                        "confidence": 0.0,
                        "language": "ja"
                    }

                # 変換されたWAVファイルを一時ファイルとして保存
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                    temp_wav.write(wav_data)
                    processed_audio_path = temp_wav.name

                logger.info(f">>> WebM→WAV変換完了: {processed_audio_path}")

                # WAVファイルの音量レベルをチェック（簡易的な無音検出）
                # WAVヘッダーは通常44バイト、その後がPCMデータ
                logger.info(f">>> WAVヘッダ(最初の50バイト): {wav_data[:50].hex()}")

                if len(wav_data) > 44:
                    pcm_data = wav_data[44:]  # ヘッダーをスキップ
                    logger.info(f">>> PCMデータサイズ: {len(pcm_data)} bytes")

                    # 16-bit PCMデータの絶対値の平均を計算（簡易的なRMS）
                    import struct
                    samples = []
                    max_sample = 0
                    min_sample = 0

                    # より多くのサンプルをチェック（最初の10000サンプル = 20000バイト）
                    sample_count = min(len(pcm_data) // 2, 10000)
                    logger.info(f">>> チェックするサンプル数: {sample_count}")

                    for i in range(0, sample_count * 2, 2):
                        if i + 1 < len(pcm_data):
                            try:
                                sample = struct.unpack('<h', pcm_data[i:i+2])[0]  # little-endian 16-bit signed
                                samples.append(abs(sample))
                                max_sample = max(max_sample, sample)
                                min_sample = min(min_sample, sample)
                            except struct.error:
                                logger.warning(f">>> サンプル読み込みエラー at index {i}")
                                break

                    if samples:
                        avg_amplitude = sum(samples) / len(samples)
                        print(f">>> 音声統計:")
                        print(f"    - サンプル数: {len(samples)}")
                        print(f"    - 平均振幅: {avg_amplitude:.2f} / 32768 ({avg_amplitude/32768*100:.2f}%)")
                        print(f"    - 最大値: {max_sample}")
                        print(f"    - 最小値: {min_sample}")
                        print(f"    - ピーク振幅: {max(abs(max_sample), abs(min_sample))}")

                        logger.info(f">>> 音声統計:")
                        logger.info(f"    - サンプル数: {len(samples)}")
                        logger.info(f"    - 平均振幅: {avg_amplitude:.2f} / 32768 ({avg_amplitude/32768*100:.2f}%)")
                        logger.info(f"    - 最大値: {max_sample}")
                        logger.info(f"    - 最小値: {min_sample}")
                        logger.info(f"    - ピーク振幅: {max(abs(max_sample), abs(min_sample))}")

                        # 振幅の情報をログに記録（閾値チェックは削除、常にWhisperに渡す）
                        if avg_amplitude < 10:
                            print(f">>> 音声レベルが極めて低い: {avg_amplitude:.2f}")
                            logger.warning(f">>> 音声レベルが極めて低い: {avg_amplitude:.2f}")
                        elif avg_amplitude < 50:
                            print(f">>> 音声レベルが低い: {avg_amplitude:.2f} (Whisperで処理を試みます)")
                            logger.info(f">>> 音声レベルが低い: {avg_amplitude:.2f} (Whisperで処理を試みます)")
                        else:
                            print(f">>> 音声レベルOK: {avg_amplitude:.2f}")
                            logger.info(f">>> 音声レベルOK: {avg_amplitude:.2f}")
                    else:
                        logger.warning(">>> サンプルが取得できませんでした")

            except Exception as e:
                logger.error(f">>> WebM変換エラー: {e}", exc_info=True)
                return {
                    "text": f"[エラー] 音声ファイルの変換に失敗しました: {str(e)}",
                    "confidence": 0.0,
                    "language": "ja"
                }
        
        # Whisper.cppの実行ファイルを検索
        whisper_exe = find_whisper_executable()
        if not whisper_exe:
            print(">>> エラー: Whisper.cppの実行ファイルが見つかりません")
            logger.error("Whisper.cppの実行ファイルが見つかりません")
            raise FileNotFoundError("Whisper.cpp executable not found")

        print(f">>> Whisper.cpp実行ファイル: {whisper_exe}")
        logger.info(f"Whisper.cpp実行ファイル: {whisper_exe}")

        # 設定からモデルパスを取得
        from ..settings import settings
        model_path = settings.whisper_model_path

        if not os.path.exists(model_path):
            print(f">>> エラー: モデルファイルが見つかりません: {model_path}")
            logger.error(f"モデルファイルが見つかりません: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")

        print(f">>> モデルファイル: {model_path}")
        logger.info(f"モデルファイル: {model_path}")
        
        # Whisper.cppを実行（標準出力/標準エラー出力から直接取得）
        cmd = [
            whisper_exe,
            "-m", model_path,  # モデルファイル
            "-f", processed_audio_path,  # 入力ファイル（変換済み）
            "-l", settings.asr_language,  # 言語
            "-t", "8",  # スレッド数（0を避けるため明示的に8に設定）
        ]
        
        print(f">>> Whisper.cppコマンド: {' '.join(cmd)}")
        print(">>> Whisper.cpp実行中... (最大5分待機)")
        logger.info(f"Whisper.cppコマンド: {' '.join(cmd)}")
        logger.info("Whisper.cpp実行中... (最大5分待機)")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',  # UTF-8エンコーディングを明示指定（Windows CP932対策）
            errors='replace',  # デコードエラー時は置換文字を使用
            timeout=300,  # 300秒（5分）タイムアウト（30秒音声の処理に十分な時間）
            cwd=os.path.dirname(os.path.abspath(whisper_exe))
        )

        print(f">>> Whisper.cpp実行完了 (returncode={result.returncode})")
        print(f">>> Whisper.cpp raw stdout: {result.stdout[:500] if result.stdout else '(empty)'}")
        print(f">>> Whisper.cpp raw stderr: {result.stderr[:500] if result.stderr else '(empty)'}")
        logger.info(f"Whisper.cpp実行完了 (returncode={result.returncode})")
        logger.info(f"Whisper.cpp raw stdout: {result.stdout[:500] if result.stdout else '(empty)'}")
        logger.info(f"Whisper.cpp raw stderr: {result.stderr[:500] if result.stderr else '(empty)'}")
        
        # returncode が 0 でなくても、出力がある場合は処理を続行
        # （Whisper.cppはstderrに結果を出力することがある）
        
        # stderrから文字起こし結果を抽出（Whisper.cppは通常stderrに出力する）
        text = ""

        if result.stderr:
            # stderrから文字起こし結果を抽出
            # Whisper.cppは以下の形式で出力する：
            # [00:00:00.000 --> 00:00:05.000]  こんにちは、これはテストです。
            lines = result.stderr.split('\n')
            logger.info(f">>> Whisper.cpp stderr lines count: {len(lines)}")

            for i, line in enumerate(lines):
                # タイムスタンプ付きの文字起こし行を探す
                if '-->' in line and ']' in line:
                    logger.info(f">>> Found transcript line {i}: {line[:100]}")
                    # タイムスタンプの後のテキストを抽出
                    text_part = line.split(']', 1)[-1].strip()
                    if text_part and not text_part.startswith('['):
                        text += text_part + " "

            text = text.strip()

        # stderrにテキストがない場合はstdoutを確認
        if not text and result.stdout:
            logger.info(">>> No text in stderr, checking stdout")
            text = result.stdout.strip()

        print(f">>> 抽出されたテキスト: {text[:200] if text else '(empty)'}")
        print(f">>> テキスト長: {len(text)} characters")
        logger.info(f">>> 抽出されたテキスト: {text[:200] if text else '(empty)'}")
        logger.info(f">>> テキスト長: {len(text)} characters")

        # テキストが空の場合
        if not text:
            print(">>> 文字起こし結果が空です（無音または認識不可）")
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
                logger.info("一時音声ファイルを削除しました")
            except Exception as e:
                logger.warning(f"一時音声ファイルの削除に失敗: {e}")
        
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
