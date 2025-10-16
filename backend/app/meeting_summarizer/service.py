"""会議要約サービス

Azure AI Foundry Responses APIを使用してASRテキストから会議要約を生成。
長文の場合はチャンク分割・統合を実施。
"""

import json
import logging
import time
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx
from pydantic import ValidationError

from ..settings import settings
from .schema import MeetingSummaryOutput, ActionItem, MEETING_SUMMARY_JSON_SCHEMA
from .preprocess import preprocess_asr_text, split_text_into_chunks

logger = logging.getLogger(__name__)

# システムプロンプト（Responses/Chat共通）
SYSTEM_PROMPT = """あなたは会議メモの要約器です。入力は音声文字起こし（ASR）です。
ASR特有のフィラー、言い直し、誤変換、重複発話、タイムスタンプ、話者ラベルを考慮し、意味を保持したまま重要情報を抽出・整理してください。

出力は厳格なJSON（余計なテキストやコードフェンス禁止）で、次の4要素を返します:
- summary: 会議全体の要約（文字数指定なし・自然な長さ）
- decisions: 決定事項の配列（具体的な数値/日付/担当は保持）
- undecided: 未決事項の配列（保留理由や不足情報を可能なら併記）
- actions: アクションアイテムの配列（title, owner, dueを含む）

ルール:
- owner, dueは必ず記載してください（不明な場合は空文字列""）
- 相対日付（例:「来週金曜」）はデフォルトタイムゾーン（{timezone}）でISO-8601形式（YYYY-MM-DD）に正規化してください
- 新規情報の創作は禁止
- 曖昧・矛盾はundecidedに分類
- 応答はJSONオブジェクトのみ"""


def _call_responses_api(
    asr_text: str,
    timeout: int = 120,
    max_retries: int = 3
) -> Optional[dict]:
    """Azure AI Foundry Responses APIを呼び出す
    
    Args:
        asr_text: 前処理済みのASRテキスト
        timeout: タイムアウト秒数
        max_retries: 最大リトライ回数
        
    Returns:
        レスポンスJSON（失敗時はNone）
    """
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        logger.warning("Azure OpenAI設定が不完全です。Responses APIを使用できません。")
        return None
    
    url = f"{settings.azure_openai_endpoint.rstrip('/')}/openai/responses"
    params = {"api-version": settings.azure_openai_api_version_responses}
    headers = {
        "Content-Type": "application/json",
        "api-key": settings.azure_openai_api_key
    }
    
    system_prompt = SYSTEM_PROMPT.format(timezone=settings.default_timezone)
    
    payload = {
        "model": settings.azure_openai_deployment,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": asr_text}
        ],
        "max_output_tokens": 2000,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "MeetingSummary",
                "strict": True,
                "schema": MEETING_SUMMARY_JSON_SCHEMA
            }
        }
    }
    
    # リトライループ（指数バックオフ）
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, params=params, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (429, 500, 502, 503, 504):
                # リトライ可能なエラー
                wait_time = 2 ** attempt
                logger.warning(
                    f"Responses API呼び出し失敗（{e.response.status_code}）: "
                    f"{attempt}/{max_retries}回目。{wait_time}秒後にリトライ..."
                )
                if attempt < max_retries:
                    time.sleep(wait_time)
                    continue
            logger.error(f"Responses API HTTPエラー: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Responses API呼び出しエラー: {e}", exc_info=True)
            return None
    
    return None


def _call_chat_completions_fallback(
    asr_text: str,
    timeout: int = 120,
    max_retries: int = 3
) -> Optional[dict]:
    """Chat Completions API（Azure OpenAI SDK）へのフォールバック
    
    Args:
        asr_text: 前処理済みのASRテキスト
        timeout: タイムアウト秒数
        max_retries: 最大リトライ回数
        
    Returns:
        パース済みのJSON dict（失敗時はNone）
    """
    try:
        from openai import AzureOpenAI
    except ImportError:
        logger.error("openaiパッケージがインストールされていません")
        return None
    
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        logger.warning("Azure OpenAI設定が不完全です。Chat Completionsを使用できません。")
        return None
    
    client = AzureOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version_chat,
        timeout=timeout
    )
    
    system_prompt = SYSTEM_PROMPT.format(timezone=settings.default_timezone)
    
    # リトライループ
    for attempt in range(1, max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=settings.azure_openai_deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": asr_text}
                ],
                max_completion_tokens=16384,
                response_format={"type": "json_object"}
            )
            
            logger.info(f"Chat Completions Response: {response}")
            content = response.choices[0].message.content if response.choices else None
            if not content:
                logger.error(f"Chat Completions: 空のレスポンス, full response: {response.model_dump() if hasattr(response, 'model_dump') else response}")
                return None
            
            # JSONとしてパース
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}, content: {content[:200]}")
                return None
            
        except Exception as e:
            if "429" in str(e) or "5" in str(e)[:1]:
                # リトライ可能なエラー
                wait_time = 2 ** attempt
                logger.warning(
                    f"Chat Completions呼び出し失敗: {attempt}/{max_retries}回目。"
                    f"{wait_time}秒後にリトライ..."
                )
                if attempt < max_retries:
                    time.sleep(wait_time)
                    continue
            logger.error(f"Chat Completionsエラー: {e}", exc_info=True)
            return None
    
    return None


def _extract_json_from_response(response_data: dict) -> Optional[dict]:
    """Responses APIレスポンスからJSONを抽出する
    
    Args:
        response_data: APIレスポンス
        
    Returns:
        抽出されたJSON dict（失敗時はNone）
    """
    try:
        # 想定パス: output.content[0].text
        if "output" in response_data and "content" in response_data["output"]:
            content_list = response_data["output"]["content"]
            if content_list and len(content_list) > 0:
                text = content_list[0].get("text", "")
                if text:
                    return json.loads(text)
        
        # フォールバック: レスポンス全体から {...} を探す
        response_str = json.dumps(response_data)
        match = json.loads(response_str)
        if isinstance(match, dict) and "summary" in match:
            return match
        
        logger.warning("Responses APIレスポンスからJSONを抽出できませんでした")
        return None
    except Exception as e:
        logger.error(f"JSONパースエラー: {e}", exc_info=True)
        return None


def _validate_and_parse_summary(data: dict) -> Optional[MeetingSummaryOutput]:
    """JSONデータをスキーマ検証してMeetingSummaryOutputに変換
    
    Args:
        data: パース済みJSON dict
        
    Returns:
        検証済みMeetingSummaryOutput（失敗時はNone）
    """
    try:
        return MeetingSummaryOutput(**data)
    except ValidationError as e:
        logger.error(f"スキーマ検証エラー: {e}")
        return None


def _merge_summaries(summaries: list[MeetingSummaryOutput]) -> MeetingSummaryOutput:
    """複数の要約結果を統合する
    
    Args:
        summaries: 要約結果のリスト
        
    Returns:
        統合された要約
    """
    if len(summaries) == 1:
        return summaries[0]
    
    # summary: 結合して冗長を抑える
    combined_summary = " ".join(s.summary for s in summaries)
    # 簡易的な冗長削除（同じ文を削除）
    sentences = combined_summary.split('。')
    unique_sentences = []
    seen = set()
    for sent in sentences:
        normalized = sent.strip()
        if normalized and normalized not in seen:
            unique_sentences.append(sent)
            seen.add(normalized)
    final_summary = '。'.join(unique_sentences)
    if final_summary and not final_summary.endswith('。'):
        final_summary += '。'
    
    # decisions/undecided: 重複除去
    all_decisions = []
    seen_decisions = set()
    for s in summaries:
        for d in s.decisions:
            normalized = d.strip()
            if normalized and normalized not in seen_decisions:
                all_decisions.append(d)
                seen_decisions.add(normalized)
    
    all_undecided = []
    seen_undecided = set()
    for s in summaries:
        for u in s.undecided:
            normalized = u.strip()
            if normalized and normalized not in seen_undecided:
                all_undecided.append(u)
                seen_undecided.add(normalized)
    
    # actions: titleをキーに重複マージ
    actions_map: dict[str, ActionItem] = {}
    for s in summaries:
        for action in s.actions:
            title_key = action.title.strip()
            if title_key in actions_map:
                # 既存のアクションと統合（owner/dueが明確な方を優先）
                existing = actions_map[title_key]
                if action.owner and not existing.owner:
                    existing.owner = action.owner
                if action.due and not existing.due:
                    existing.due = action.due
            else:
                actions_map[title_key] = action
    
    return MeetingSummaryOutput(
        summary=final_summary,
        decisions=all_decisions,
        undecided=all_undecided,
        actions=list(actions_map.values())
    )


def summarize_meeting(
    asr_text: str,
    keep_noise: bool = False,
    use_fallback: bool = True,
    verbose: bool = False
) -> MeetingSummaryOutput:
    """会議ASRテキストから要約を生成する
    
    1. ASRテキストの前処理
    2. 長文の場合はチャンク分割
    3. 各チャンクに対してResponses API呼び出し（失敗時はChat Completionsへフォールバック）
    4. 結果を統合してスキーマ検証
    
    Args:
        asr_text: 音声文字起こしテキスト
        keep_noise: フィラー削除を弱める場合True
        use_fallback: Chat Completionsへのフォールバックを許可
        verbose: 詳細ログを出力
        
    Returns:
        会議要約結果
        
    Raises:
        ValueError: APIキー未設定、または要約生成失敗
    """
    if not asr_text or not asr_text.strip():
        raise ValueError("ASRテキストが空です")
    
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        raise ValueError(
            "Azure OpenAI設定が不完全です。環境変数 AZURE_OPENAI_ENDPOINT と "
            "AZURE_OPENAI_API_KEY を設定してください。"
        )
    
    # 前処理
    if verbose:
        logger.info("ASRテキストを前処理中...")
    preprocessed = preprocess_asr_text(asr_text, keep_noise=keep_noise)
    
    # チャンク分割
    chunks = split_text_into_chunks(preprocessed, max_tokens_per_chunk=8000)
    if verbose:
        logger.info(f"テキストを{len(chunks)}個のチャンクに分割しました")
    
    summaries: list[MeetingSummaryOutput] = []
    
    for i, chunk in enumerate(chunks, start=1):
        if verbose:
            logger.info(f"チャンク {i}/{len(chunks)} を処理中...")
        
        # Responses API呼び出し
        response_data = _call_responses_api(chunk)
        parsed_json: Optional[dict] = None
        
        if response_data:
            parsed_json = _extract_json_from_response(response_data)
        
        # フォールバック: Chat Completions
        if not parsed_json and use_fallback:
            if verbose:
                logger.info("Chat Completions APIへフォールバック...")
            parsed_json = _call_chat_completions_fallback(chunk)
        
        if not parsed_json:
            logger.error(f"チャンク {i} の要約生成に失敗しました")
            continue
        
        # スキーマ検証
        summary = _validate_and_parse_summary(parsed_json)
        if summary:
            summaries.append(summary)
            if verbose:
                logger.info(f"チャンク {i} の要約完了")
        else:
            logger.error(f"チャンク {i} のスキーマ検証に失敗しました")
    
    if not summaries:
        raise ValueError("要約生成に失敗しました。APIレスポンスを確認してください。")
    
    # 統合
    if verbose:
        logger.info("要約結果を統合中...")
    final_summary = _merge_summaries(summaries)
    
    if verbose:
        logger.info("要約生成完了")
    
    return final_summary

