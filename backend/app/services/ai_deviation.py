"""
AIベースの脱線検知サービス

Azure OpenAI APIを使用して、より高精度な脱線検知を実装
"""

from __future__ import annotations

import json
import logging
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
            logger.warning("Azure OpenAI設定が不完全です。スタブモードで動作します。")
            self.stub_mode = True
        else:
            self.stub_mode = False
    
    async def check_deviation(
        self,
        recent_transcripts: List[Dict[str, Any]],
        agenda_titles: List[str],
        threshold: float = 0.3,
        consecutive_chunks: int = 3
    ) -> DeviationAnalysis:
        """
        AIベースのリアルタイム脱線検知
        
        Args:
            recent_transcripts: 直近の文字起こし結果のリスト
            agenda_titles: アジェンダタイトルのリスト
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
            
            # スタブモードの場合は従来の手法を使用
            if self.stub_mode:
                return await self._check_deviation_stub(recent_text, agenda_titles, threshold)
            
            # AIベースの脱線検知を実行
            return await self._check_deviation_ai(recent_text, agenda_titles, threshold)
            
        except Exception as e:
            logger.error(f"脱線検知エラー: {e}", exc_info=True)
            return self._create_error_result(str(e))
    
    async def _check_deviation_ai(
        self,
        recent_text: str,
        agenda_titles: List[str],
        threshold: float
    ) -> DeviationAnalysis:
        """AIベースの脱線検知（Azure OpenAI使用）"""
        
        # プロンプトを構築
        prompt = self._build_deviation_prompt(recent_text, agenda_titles, threshold)
        
        try:
            # Azure OpenAI APIを呼び出し
            response = await self._call_azure_openai(prompt)
            
            # レスポンスをパース
            analysis = self._parse_ai_response(response, recent_text, agenda_titles)
            
            logger.info(f"AI脱線検知完了: is_deviation={analysis.is_deviation}, confidence={analysis.confidence}")
            return analysis
            
        except Exception as e:
            logger.error(f"Azure OpenAI API呼び出しエラー: {e}")
            # フォールバック: 従来の手法を使用
            return await self._check_deviation_stub(recent_text, agenda_titles, threshold)
    
    def _build_deviation_prompt(self, recent_text: str, agenda_titles: List[str], threshold: float) -> str:
        """脱線検知用のプロンプトを構築"""
        
        agenda_list = "\n".join([f"- {title}" for title in agenda_titles])
        
        prompt = f"""
あなたは会議ファシリテーションの専門家です。以下の会議の発話内容が、設定されたアジェンダから脱線しているかを分析してください。

## アジェンダ
{agenda_list}

## 分析対象の発話
{recent_text}

## 分析要件
1. 発話内容がアジェンダのいずれかと関連しているかを判定
2. 関連度を0.0-1.0のスコアで評価（1.0=完全に関連、0.0=全く無関係）
3. 脱線している場合は、最も関連性の高いアジェンダを特定
4. 脱線の理由を簡潔に説明

## 出力形式（JSON）
{{
    "is_deviation": true/false,
    "confidence": 0.0-1.0,
    "similarity_score": 0.0-1.0,
    "best_agenda": "最も関連性の高いアジェンダタイトル",
    "reasoning": "判定理由の簡潔な説明",
    "suggested_agenda": ["推奨アジェンダ1", "推奨アジェンダ2"]
}}

## 判定基準
- しきい値: {threshold}
- 類似度が{threshold}未満の場合、脱線と判定
- アジェンダとの関連性は、内容の意味的関連性を重視
- 単純なキーワードマッチではなく、文脈や意図を考慮

JSONのみを出力してください。
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
                    "content": "あなたは会議ファシリテーションの専門家です。JSON形式で正確に回答してください。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.1,  # 低い温度で一貫性のある結果
            "top_p": 0.9
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                params={"api-version": self.api_version},
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    def _parse_ai_response(
        self,
        response: str,
        recent_text: str,
        agenda_titles: List[str]
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
            
            # メッセージを生成
            if data.get("is_deviation", False):
                message = f"直近の発話がアジェンダ「{data.get('best_agenda', '')}」から脱線している可能性があります（類似度: {data.get('similarity_score', 0):.2f}）"
            else:
                message = f"アジェンダ「{data.get('best_agenda', '')}」に沿った発話です（類似度: {data.get('similarity_score', 0):.2f}）"
            
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
            logger.error(f"AIレスポンスのパースエラー: {e}, response: {response}")
            # フォールバック: デフォルト値を返す
            return DeviationAnalysis(
                is_deviation=False,
                confidence=0.0,
                similarity_score=0.0,
                best_agenda=agenda_titles[0] if agenda_titles else "",
                message="AI分析に失敗しました",
                suggested_agenda=agenda_titles[:2] if agenda_titles else [],
                recent_text=recent_text,
                reasoning="AIレスポンスのパースに失敗",
                timestamp=datetime.now(timezone.utc).isoformat()
            )
    
    async def _check_deviation_stub(
        self,
        recent_text: str,
        agenda_titles: List[str],
        threshold: float
    ) -> DeviationAnalysis:
        """スタブモード（従来の手法）での脱線検知"""
        
        # 従来のJaccard係数ベースの類似度計算
        from .deviation import similarity
        
        similarities = []
        for agenda in agenda_titles:
            sim = similarity(recent_text, agenda)
            similarities.append((sim, agenda))
        
        similarities.sort(reverse=True)
        best_similarity, best_agenda = similarities[0] if similarities else (0.0, "")
        
        is_deviation = best_similarity < threshold
        suggested_agenda = [agenda for _, agenda in similarities[:2]]
        
        if is_deviation:
            message = f"直近の発話がアジェンダ「{best_agenda}」から脱線している可能性があります（類似度: {best_similarity:.2f}）"
        else:
            message = f"アジェンダ「{best_agenda}」に沿った発話です（類似度: {best_similarity:.2f}）"
        
        return DeviationAnalysis(
            is_deviation=is_deviation,
            confidence=1.0 - best_similarity,
            similarity_score=best_similarity,
            best_agenda=best_agenda,
            message=message,
            suggested_agenda=suggested_agenda,
            recent_text=recent_text,
            reasoning="従来のJaccard係数ベースの分析（スタブモード）",
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


# シングルトンインスタンス
ai_deviation_service = AIDeviationService()
