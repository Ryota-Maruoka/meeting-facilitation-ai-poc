"""
AIベースの脱線検知サービス

Azure OpenAI APIを使用して、より高精度な脱線検知を実装
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

import httpx
from pydantic import BaseModel

from ..settings import settings

logger = logging.getLogger(__name__)


class DeviationAnalysis(BaseModel):
    """脱線検知分析結果"""
    is_deviation: bool
    confidence: float
    similarity_score: float
    best_agenda: str
    message: str
    suggested_agenda: List[str]
    recent_text: str
    reasoning: str
    timestamp: str


class AIDeviationService:
    """AIベースの脱線検知サービス"""
    
    def __init__(self):
        self.azure_endpoint = settings.azure_openai_endpoint
        self.api_key = settings.azure_openai_api_key
        self.deployment = settings.azure_openai_deployment
        self.api_version = settings.azure_openai_api_version_chat
        
        if not self.azure_endpoint or not self.api_key:
            logger.error("⚠️ Azure OpenAI設定が不完全です。endpoint と api_key を設定してください。")
    
    async def check_deviation(
        self,
        recent_transcripts: List[Dict[str, Any]],
        agenda_items: List[Dict[str, Any]],
        threshold: float = 0.3,
        consecutive_chunks: int = 3
    ) -> DeviationAnalysis:
        """
        AIベースのリアルタイム脱線検知
        
        Args:
            recent_transcripts: 直近の文字起こし結果のリスト
            agenda_items: アジェンダ項目のリスト（タイトル、期待成果物を含む）
            threshold: 脱線判定のしきい値
            consecutive_chunks: 連続して脱線と判定するチャンク数
            
        Returns:
            脱線検知分析結果
        """
        try:
            # データの前処理
            if not recent_transcripts or len(recent_transcripts) < consecutive_chunks:
                return self._create_no_data_result()
            
            # 直近の文字起こし結果を結合
            recent_text = " ".join([
                t.get("text", "") for t in recent_transcripts[-consecutive_chunks:]
            ]).strip()
            
            if not recent_text:
                return self._create_no_text_result()
            
            # Azure OpenAI APIでAI脱線検知を実行
            return await self._check_deviation_ai(recent_text, agenda_items, threshold)
            
        except Exception as e:
            logger.error(f"脱線検知エラー: {e}", exc_info=True)
            return self._create_error_result(str(e))
    
    async def _check_deviation_ai(
        self,
        recent_text: str,
        agenda_items: List[Dict[str, Any]],
        threshold: float
    ) -> DeviationAnalysis:
        """AIベースの脱線検知（Azure OpenAI使用）"""
        
        # プロンプトを構築
        prompt = self._build_deviation_prompt(recent_text, agenda_items, threshold)
        
        try:
            # Azure OpenAI APIを呼び出し
            response = await self._call_azure_openai(prompt)
            
            # レスポンスをパース
            analysis = self._parse_ai_response(response, recent_text, agenda_items)
            
            logger.info(f"AI脱線検知完了: is_deviation={analysis.is_deviation}, confidence={analysis.confidence}")
            return analysis
            
        except Exception as e:
            logger.error(f"Azure OpenAI API呼び出しエラー: {e}")
            raise  # エラーを上位に伝播
    
    def _build_deviation_prompt(self, recent_text: str, agenda_items: List[Dict[str, Any]], threshold: float) -> str:
        """脱線検知用のプロンプトを構築"""
        
        # アジェンダ項目を詳細に記述（タイトル + 期待成果物）
        agenda_list = []
        for idx, item in enumerate(agenda_items, 1):
            title = item.get("title", "")
            expected_outcome = item.get("expectedOutcome", "")
            duration = item.get("duration", 0)
            
            agenda_str = f"{idx}. 【議題】{title}"
            if expected_outcome:
                agenda_str += f"\n    【期待成果物】{expected_outcome}"
            if duration:
                agenda_str += f"\n    【所要時間】{duration}分"
            
            agenda_list.append(agenda_str)
        
        agenda_text = "\n\n".join(agenda_list)
        
        prompt = f"""
あなたは会議ファシリテーションの専門家です。以下の会議の発話内容が、設定されたアジェンダ（議題と期待成果物）から脱線しているかを厳密に分析してください。

## アジェンダ（議題と期待成果物）
{agenda_text}

## 分析対象の発話
{recent_text}

## 関連度計算（合計0.0-1.0）
1. 意味的関連性: 0.0-0.6（議題・期待成果物との合致度）
2. キーワード: 0.0-0.2（重要語の一致）
3. 文脈整合性: 0.0-0.2（会議目的との整合）

## 判定
- 関連度 < {threshold} → 脱線
- 関連度 >= {threshold} → アジェンダに沿っている

## 出力（JSONのみ）
{{
    "is_deviation": true/false,
    "confidence": 0.0-1.0,
    "similarity_score": 0.0-1.0,
    "best_agenda": "議題タイトル",
    "reasoning": "簡潔に（3行程度）：各要素のスコアと根拠",
    "suggested_agenda": ["議題1", "議題2"]
}}

期待成果物も考慮してください。JSONのみ出力。
"""
        return prompt
    
    async def _call_azure_openai(self, prompt: str) -> str:
        """Azure OpenAI APIを呼び出し"""
        
        url = f"{self.azure_endpoint}/openai/deployments/{self.deployment}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "あなたは会議ファシリテーションの専門家です。必ずJSON形式のみで回答してください。JSON以外のテキストは一切出力しないでください。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_completion_tokens": 2000,  # reasoningモデル用に増加（1000→2000）
            "response_format": {"type": "json_object"}  # JSON出力を強制
        }
        
        logger.info(f"Azure OpenAI API呼び出し: {url}")
        logger.info(f"APIバージョン: {self.api_version}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                params={"api-version": self.api_version},
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            # レスポンスの内容をデバッグログに出力
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            logger.debug(f"Azure OpenAI APIレスポンス内容: {content[:500]}")  # 最初の500文字をログ出力
            
            if not content:
                logger.error(f"Azure OpenAI APIから空のレスポンス: {result}")
                raise ValueError("Azure OpenAI APIから空のレスポンスが返されました")
            
            return content
    
    def _parse_ai_response(
        self,
        response: str,
        recent_text: str,
        agenda_items: List[Dict[str, Any]]
    ) -> DeviationAnalysis:
        """AIレスポンスをパースしてDeviationAnalysisオブジェクトを作成"""
        
        try:
            # JSONを抽出（```json```で囲まれている場合がある）
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()
            
            # JSONをパース
            data = json.loads(json_str)
            
            # アジェンダタイトルリストを作成（フォールバック用）
            agenda_titles = [item.get("title", "") for item in agenda_items if item.get("title")]
            
            # メッセージを生成
            if data.get("is_deviation", False):
                message = f"直近の発話がアジェンダ「{data.get('best_agenda', '')}」から脱線している可能性があります（関連度: {data.get('similarity_score', 0):.2f}）"
            else:
                message = f"アジェンダ「{data.get('best_agenda', '')}」に沿った発話です（関連度: {data.get('similarity_score', 0):.2f}）"
            
            return DeviationAnalysis(
                is_deviation=data.get("is_deviation", False),
                confidence=data.get("confidence", 0.0),
                similarity_score=data.get("similarity_score", 0.0),
                best_agenda=data.get("best_agenda", ""),
                message=message,
                suggested_agenda=data.get("suggested_agenda", []),
                recent_text=recent_text,
                reasoning=data.get("reasoning", ""),
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"AIレスポンスのパースエラー: {e}")
            logger.error(f"レスポンス内容（最初の500文字）: {response[:500] if response else '(空)'}")
            logger.error(f"レスポンス長: {len(response) if response else 0}")
            # フォールバック: デフォルト値を返す
            agenda_titles = [item.get("title", "") for item in agenda_items if item.get("title")]
            return DeviationAnalysis(
                is_deviation=False,
                confidence=0.0,
                similarity_score=0.0,
                best_agenda=agenda_titles[0] if agenda_titles else "",
                message="AI分析に失敗しました",
                suggested_agenda=agenda_titles[:2] if agenda_titles else [],
                recent_text=recent_text,
                reasoning=f"AIレスポンスのパースに失敗: {str(e)}",
                timestamp=datetime.now(timezone.utc).isoformat()
            )
    
    def _create_no_data_result(self) -> DeviationAnalysis:
        """データ不足時の結果"""
        return DeviationAnalysis(
            is_deviation=False,
            confidence=0.0,
            similarity_score=0.0,
            best_agenda="",
            message="データ不足",
            suggested_agenda=[],
            recent_text="",
            reasoning="文字起こしデータが不足",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    def _create_no_text_result(self) -> DeviationAnalysis:
        """テキストが空の場合の結果"""
        return DeviationAnalysis(
            is_deviation=False,
            confidence=0.0,
            similarity_score=0.0,
            best_agenda="",
            message="テキストが空",
            suggested_agenda=[],
            recent_text="",
            reasoning="文字起こしテキストが空",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    def _create_error_result(self, error_message: str) -> DeviationAnalysis:
        """エラー時の結果"""
        return DeviationAnalysis(
            is_deviation=False,
            confidence=0.0,
            similarity_score=0.0,
            best_agenda="",
            message=f"エラー: {error_message}",
            suggested_agenda=[],
            recent_text="",
            reasoning=f"処理エラー: {error_message}",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    async def generate_parking_title(self, deviation_text: str) -> str:
        """
        脱線内容から保留事項のタイトルを自動生成
        
        Args:
            deviation_text: 脱線検知された発話内容
            
        Returns:
            生成されたタイトル
        """
        logger.info(f"🔍 タイトル生成を開始: {deviation_text[:100]}...")
        
        try:
            logger.info("✅ Azure OpenAI APIでタイトルを生成中...")
            return await self._generate_title_ai(deviation_text)
            
        except Exception as e:
            logger.error(f"❌ タイトル生成エラー: {e}", exc_info=True)
            # エラー時は最初の20文字を返す
            fallback_title = deviation_text[:20]
            logger.warning(f"⚠️ エラー発生のためフォールバック: {fallback_title}")
            return fallback_title
    
    async def _generate_title_ai(self, deviation_text: str) -> str:
        """Azure OpenAI APIを使用してタイトルを生成"""
        
        prompt = f"""
以下の会議中の発話内容から、簡潔で分かりやすい保留事項のタイトルを生成してください。

## 発話内容
{deviation_text}

## 要件
- タイトルは30文字以内で簡潔に
- 発話内容の本質を捉えた表現
- 日本語で自然な表現
- 箇条書きや記号は使用しない

## 出力形式
タイトルのみを直接出力してください（JSON形式は使用しない）。
例: PowerPoint出力時のフォントずれ対策
"""
        
        response = await self._call_azure_openai(prompt)
        logger.info(f"🔍 AI生レスポンス: {response}")
        
        # レスポンスからタイトルを抽出
        title = response.strip()

        # 1️⃣ JSON風 { "title": "..." } or {title: ...} 対応
        match = re.search(r'[\"\']?title[\"\']?\s*[:：]\s*[\"\']?([^\"\'{}]+)[\"\']?', title)
        if match:
            title = match.group(1).strip()
        else:
            # 2️⃣ 「タイトル: ...」や単純出力にも対応
            match = re.search(r'タイトル\s*[:：]\s*(.+)', title)
            if match:
                title = match.group(1).strip()
            else:
                # 3️⃣ それ以外はそのまま出力
                title = title

        # 4️⃣ クォートなどを削除
        title = title.replace('"', '').replace("'", '').replace("{", "").replace("}", "").strip()

        logger.info(f"✅ 生成されたタイトル: {title}")
        return title[:30]    

# シングルトンインスタンス
ai_deviation_service = AIDeviationService()
