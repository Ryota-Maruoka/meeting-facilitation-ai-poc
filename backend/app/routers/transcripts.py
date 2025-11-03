"""文字起こしエンドポイント"""
from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse, StreamingResponse

from ..schemas.transcript import TranscriptChunk
from ..storage import DataStore
from ..services.asr import transcribe_audio_file, convert_webm_to_format, combine_webm_chunks
from ..settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings/{meeting_id}", tags=["transcripts"])

# DataStore
store = DataStore(settings.data_dir)


def _calculate_elapsed_time(meeting_start_iso: str | None, current_iso: str) -> str:
    """会議開始時刻からの経過時間を計算してHH:MM:SS形式で返す

    Args:
        meeting_start_iso: 会議開始時刻（ISO 8601形式）、Noneの場合は空文字列を返す
        current_iso: 現在のタイムスタンプ（ISO 8601形式）

    Returns:
        HH:MM:SS形式の経過時間
    """
    if not meeting_start_iso:
        return "00:00:00"

    try:
        start_time = datetime.fromisoformat(meeting_start_iso.replace("Z", "+00:00"))
        current_time = datetime.fromisoformat(current_iso.replace("Z", "+00:00"))
        elapsed_ms = (current_time - start_time).total_seconds() * 1000

        # 負の値の場合は00:00:00を返す
        if elapsed_ms < 0:
            return "00:00:00"

        total_seconds = int(elapsed_ms / 1000)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except (ValueError, AttributeError) as e:
        logger.warning("Failed to calculate elapsed time: %s", e)
        return "00:00:00"


@router.post("/transcripts")
def add_transcript(meeting_id: str, chunk: TranscriptChunk) -> dict:
    """文字起こしチャンクを追加する。

    Args:
        meeting_id: 会議ID
        chunk: 文字起こしチャンク

    Returns:
        追加結果

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 文字起こしデータを準備
    chunk_data = chunk.model_dump()
    
    # タイムスタンプを追加（絶対時刻）
    current_timestamp = datetime.now(timezone.utc).isoformat()
    chunk_data["timestamp"] = current_timestamp
    
    # 経過時間を計算して追加（会議開始時刻が確定している場合）
    meeting_start_iso = meeting.get("started_at")
    chunk_data["elapsed_time"] = _calculate_elapsed_time(meeting_start_iso, current_timestamp)

    # 新しいストレージ構造: transcripts.jsonに追記
    store.append_transcript(meeting_id, chunk_data)

    # 追加後のカウントを取得
    transcripts = store.load_transcripts(meeting_id)
    return {"ok": True, "count": len(transcripts)}


@router.get("/transcripts")
def list_transcripts(meeting_id: str) -> list:
    """文字起こし一覧を取得する。

    Args:
        meeting_id: 会議ID

    Returns:
        文字起こし一覧

    Raises:
        HTTPException: 会議が見つからない場合
    """
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 新しいストレージ構造: transcripts.jsonから読み込む
    return store.load_transcripts(meeting_id)


@router.post("/transcribe")
async def transcribe_audio_upload(
    meeting_id: str, file: UploadFile = File(...)
) -> dict:
    """会議音声を文字起こしする。

    Args:
        meeting_id: 会議ID
        file: アップロードされた音声ファイル

    Returns:
        文字起こし結果

    Raises:
        HTTPException: 会議が見つからない場合、音声処理エラー
    """
    try:
        logger.info("Received transcription request for meeting %s", meeting_id)

        # 会議の存在確認
        meeting = store.load_meeting(meeting_id)
        if not meeting:
            logger.error("Meeting not found: %s", meeting_id)
            raise HTTPException(404, "Meeting not found")

        # ファイルの詳細ログ
        logger.info(
            "Audio file: %s, content_type: %s, size: %s",
            file.filename,
            file.content_type,
            file.size,
        )

        # ファイルサイズのバリデーション
        if file.size and file.size < 1000:  # 1KB未満は無効
            logger.error("Audio file too small: %s bytes", file.size)
            raise HTTPException(400, "音声ファイルが小さすぎます")

        if file.size and file.size > 50 * 1024 * 1024:  # 50MB制限
            logger.error("Audio file too large: %s bytes", file.size)
            raise HTTPException(400, "音声ファイルが大きすぎます（50MB以下）")

        # 音声ファイルの内容を読み込み
        content = await file.read()
        logger.info("Audio file content size: %s bytes", len(content))

        # 一時ファイルに保存
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # 音声文字起こし実行
            result = await transcribe_audio_file(temp_file_path)

            # 文字起こし結果にIDとタイムスタンプを追加
            current_timestamp = datetime.now(timezone.utc).isoformat()
            transcript_entry = {
                "id": str(uuid4()),
                "timestamp": current_timestamp,
                "text": result.get("text", ""),
                "language": result.get("language", "ja"),
            }

            # 経過時間を計算して追加（会議開始時刻が確定している場合）
            meeting_start_iso = meeting.get("started_at")
            transcript_entry["elapsed_time"] = _calculate_elapsed_time(
                meeting_start_iso, current_timestamp
            )

            # 新しいストレージ構造: transcripts.jsonに追記
            store.append_transcript(meeting_id, transcript_entry)

            # 音声データを録音ファイルに追記（1つのファイルにまとめる）
            store.append_audio_chunk(meeting_id, content)

            # 会議メタデータの更新日時を更新
            # 注意: parkingフィールドなどの既存データを保護するため、保存前に最新データを再読み込み
            meeting_to_update = store.load_meeting(meeting_id)
            if meeting_to_update:
                meeting_to_update["updated_at"] = datetime.now(timezone.utc).isoformat()
                store.save_meeting(meeting_id, meeting_to_update)

            logger.info("Transcription completed successfully for meeting %s", meeting_id)
            return transcript_entry

        finally:
            # 一時ファイルを削除
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except HTTPException:
        # HTTPExceptionはそのまま再発生
        raise
    except Exception as e:
        logger.error("Transcription failed for meeting %s: %s", meeting_id, e, exc_info=True)
        raise HTTPException(500, f"Transcription failed: {str(e)}")


@router.get("/audio/download")
def download_audio(
    meeting_id: str,
    format: str = Query("mp3", description="出力形式: mp3, wav, webm")
) -> FileResponse:
    """会議の録音ファイルをダウンロードする。

    Args:
        meeting_id: 会議ID
        format: 出力形式（"mp3", "wav", "webm"のいずれか、デフォルト: "mp3"）

    Returns:
        録音ファイル（指定された形式）

    Raises:
        HTTPException: 会議が見つからない場合、録音ファイルが存在しない場合、形式変換エラー
    """
    # 会議の存在確認
    meeting = store.load_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # 形式の検証
    format_lower = format.lower()
    supported_formats = ["mp3", "wav", "webm"]
    if format_lower not in supported_formats:
        raise HTTPException(400, f"サポートされていない形式: {format} (対応形式: {', '.join(supported_formats)})")

    # 会議タイトルを使用してファイル名を生成（ファイル名に使用できない文字を除去）
    meeting_title = meeting.get("title", "meeting")
    
    # ファイル名で使用できない文字を定義（Windows/Mac/Linux共通）
    # < > : " / \ | ? * および制御文字（null文字など）
    invalid_chars = '<>:"/\\|?*\x00'
    
    # ASCII文字のみを抽出し、使用できない文字を除去
    # HTTPヘッダーはlatin-1でエンコードされるため、ASCIIのみにする必要がある
    safe_title = ""
    for c in meeting_title:
        # ASCII文字のみ、かつ使用できない文字でない場合のみ追加
        if ord(c) < 128 and c not in invalid_chars:
            # 英数字、または許可された記号（スペース、ハイフン、アンダースコア、括弧、ドット）
            if c.isalnum() or c in (" ", "-", "_", "(", ")", "."):
                safe_title += c
    
    # 最大50文字に制限
    safe_title = safe_title[:50].strip()
    
    # スペースをアンダースコアに置換
    safe_title = safe_title.replace(" ", "_")
    
    # 連続するアンダースコアを1つにまとめる
    while "__" in safe_title:
        safe_title = safe_title.replace("__", "_")
    
    # 先頭・末尾のアンダースコアやハイフンを除去
    safe_title = safe_title.strip("_-")
    
    # 空文字列の場合はデフォルト値を使用
    if not safe_title:
        safe_title = "meeting"
    
    # 日付をYYYYMMDD形式で取得（会議日時または作成日時から）
    date_str = ""
    meeting_date = meeting.get("started_at") or meeting.get("created_at")
    if meeting_date:
        try:
            # ISO 8601形式の文字列から日付を抽出
            if isinstance(meeting_date, str):
                dt = datetime.fromisoformat(meeting_date.replace("Z", "+00:00"))
            else:
                dt = meeting_date
            date_str = dt.strftime("%Y%m%d")  # YYYYMMDD形式（4桁年）
        except (ValueError, AttributeError) as e:
            logger.warning("Failed to parse meeting date: %s", e)
            # フォールバック: 現在の日付を使用
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    else:
        # 日付情報がない場合は現在の日付を使用
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    
    # ファイル名形式: 会議名_日付.拡張子
    filename = f"{safe_title}_{date_str}.{format_lower}"
    
    # Content-Dispositionヘッダー用に設定
    # HTTPヘッダーはlatin-1でエンコードされるため、filenameはASCIIのみ
    # 日本語を含む元のファイル名が必要な場合は、filename*を使用（ただし、Starletteの制約によりASCIIのみを使用）
    filename_header = f'attachment; filename="{filename}"'

    # 音声チャンクファイルのリストを取得（新しい方式）
    chunk_files = store.list_audio_chunks(meeting_id)
    
    # 後方互換性: チャンクファイルがない場合は既存のrecording.webmを使用
    webm_source_path = None
    combined_webm_path = None
    
    if not chunk_files:
        recording_path = store.get_recording_path(meeting_id)
        if not os.path.exists(recording_path):
            raise HTTPException(404, "Recording file not found")
        # 既存ファイルを使用（WebM形式の場合のみ）
        if format_lower == "webm":
            logger.info("既存のrecording.webmファイルを使用: %s", recording_path)
            # FileResponseはfilenameパラメータで直接設定されるが、ヘッダーも設定可能
            response = FileResponse(
                path=recording_path,
                media_type="audio/webm",
                filename=filename,
            )
            response.headers["Content-Disposition"] = filename_header
            return response
        # 変換が必要な場合は、既存ファイルを使用
        webm_source_path = recording_path
    else:
        # 新しい方式: チャンクファイルを結合
        logger.info("音声チャンクファイルを結合: %d個のチャンク", len(chunk_files))
        
        # 一時的に結合されたWebMファイルを作成
        import tempfile
        combined_webm = tempfile.NamedTemporaryFile(suffix='.webm', delete=False)
        combined_webm_path = combined_webm.name
        combined_webm.close()
        
        try:
            # FFmpegでチャンクを結合
            combine_webm_chunks(chunk_files, combined_webm_path)
            webm_source_path = combined_webm_path
            logger.info("チャンク結合完了: %s", combined_webm_path)
        except Exception as e:
            # 結合に失敗した場合、一時ファイルを削除
            if os.path.exists(combined_webm_path):
                try:
                    os.unlink(combined_webm_path)
                except Exception:
                    pass
            logger.error("WebMチャンクの結合に失敗: %s", e, exc_info=True)
            raise HTTPException(500, f"音声ファイルの結合に失敗しました: {str(e)}")

    # WebM形式の場合は変換不要
    if format_lower == "webm":
        # 結合済みWebMファイルを使用
        if not os.path.exists(webm_source_path):
            raise HTTPException(500, "結合されたWebMファイルが見つかりません")
        
        logger.info("Downloading audio file (WebM) for meeting %s: %s", meeting_id, webm_source_path)
        
        # 一時ファイルの場合は、読み込み後に削除
        if webm_source_path != store.get_recording_path(meeting_id):
            def webm_file_generator(file_path: str):
                file_handle = None
                try:
                    file_handle = open(file_path, "rb")
                    chunk_size = 64 * 1024
                    while True:
                        chunk = file_handle.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    if file_handle:
                        file_handle.close()
                    if os.path.exists(file_path):
                        try:
                            os.unlink(file_path)
                            logger.info("一時結合ファイルを削除: %s", file_path)
                        except Exception as e:
                            logger.warning("一時ファイルの削除に失敗: %s", e)
            
            file_size = os.path.getsize(webm_source_path)
            return StreamingResponse(
                webm_file_generator(webm_source_path),
                media_type="audio/webm",
                headers={
                    "Content-Disposition": filename_header,
                    "Content-Length": str(file_size),
                }
            )
        else:
            # 既存ファイルの場合はそのまま返す
            response = FileResponse(
                path=webm_source_path,
                media_type="audio/webm",
                filename=filename,
            )
            response.headers["Content-Disposition"] = filename_header
            return response

    # その他の形式の場合は変換が必要
    try:
        # WebMを指定形式に変換（結合済みファイルを使用）
        converted_path = convert_webm_to_format(webm_source_path, format_lower)
        
        # 変換されたファイルが存在し、サイズが0でないことを確認
        if not os.path.exists(converted_path):
            raise HTTPException(500, "音声ファイルの変換に失敗しました（ファイルが生成されませんでした）")
        
        converted_file_size = os.path.getsize(converted_path)
        if converted_file_size == 0:
            raise HTTPException(500, "音声ファイルの変換に失敗しました（ファイルサイズが0です）")
        
        logger.info("変換完了: ファイルサイズ=%d bytes, パス=%s", converted_file_size, converted_path)
        
        # メディアタイプを決定
        media_types = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
        }
        media_type = media_types.get(format_lower, "audio/octet-stream")
        
        logger.info("Downloading audio file (%s) for meeting %s: %s", format_lower, meeting_id, converted_path)
        
        # ファイルをチャンク単位で読み込んでから削除するためのジェネレータ関数
        def file_generator(file_path: str):
            """ファイルをチャンク単位で読み込んで返し、読み込み完了後に削除する"""
            file_handle = None
            try:
                # ファイルをバイナリモードで開く
                file_handle = open(file_path, "rb")
                
                # チャンクサイズを64KBに設定（メモリ効率とパフォーマンスのバランス）
                chunk_size = 64 * 1024
                
                while True:
                    chunk = file_handle.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
                    
            finally:
                # ファイルハンドルを閉じる
                if file_handle:
                    try:
                        file_handle.close()
                    except Exception as close_error:
                        logger.warning("ファイルハンドルのクローズに失敗: %s", close_error)
                
                # ファイル読み込み完了後に一時ファイルを削除
                try:
                    if os.path.exists(file_path):
                        os.unlink(file_path)
                        logger.info("一時ファイルを削除: %s", file_path)
                except Exception as cleanup_error:
                    logger.warning("一時ファイルの削除に失敗: %s", cleanup_error)
        
        return StreamingResponse(
            file_generator(converted_path),
            media_type=media_type,
            headers={
                "Content-Disposition": filename_header,
                "Content-Length": str(converted_file_size),
            }
        )
    except Exception as e:
        logger.error("Failed to convert audio file: %s", e, exc_info=True)
        # エラーメッセージを安全に取得
        try:
            error_detail = str(e)
        except (UnicodeEncodeError, UnicodeDecodeError):
            # エンコーディングエラーが発生した場合は、エラータイプのみを表示
            error_detail = f"{type(e).__name__}: エンコーディングエラー（詳細はログを確認してください）"
        raise HTTPException(500, f"音声ファイルの変換に失敗しました: {error_detail}")
    finally:
        # 結合済みWebMファイルが一時ファイルの場合は削除
        if combined_webm_path and webm_source_path == combined_webm_path:
            if os.path.exists(webm_source_path):
                try:
                    os.unlink(webm_source_path)
                    logger.info("一時結合ファイルをクリーンアップ: %s", webm_source_path)
                except Exception as cleanup_error:
                    logger.warning("一時結合ファイルの削除に失敗: %s", cleanup_error)

