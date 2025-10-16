from typing import List, Tuple, Dict, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# 脱線検知のための類似度計算
def similarity(a: str, b: str) -> float:
    """2つのテキストの類似度を計算（Jaccard係数ベース）"""
    a_words = set(w for w in a.lower().split() if len(w) > 1)
    b_words = set(w for w in b.lower().split() if len(w) > 1)
    if not a_words or not b_words:
        return 0.0
    inter = len(a_words & b_words)
    union = len(a_words | b_words)
    return inter / union if union else 0.0


def check_deviation(text: str, agenda_titles: List[str], threshold: float = 0.3) -> Tuple[float, str, List[str]]:
    """単一テキストの脱線検知"""
    best = 0.0
    best_titles: List[str] = []
    for t in agenda_titles:
        s = similarity(text, t)
        if s > best:
            best = s
            best_titles = [t]
        elif s == best and s > 0:
            best_titles.append(t)
    label = "on_track" if best >= threshold else "possible_deviation"
    # If deviation, suggest top 2 agenda to return to
    scored = sorted([(similarity(text, t), t) for t in agenda_titles], reverse=True)
    targets = [t for _, t in scored[:2]]
    return best, label, targets


def check_realtime_deviation(
    recent_transcripts: List[Dict[str, Any]], 
    agenda_titles: List[str], 
    threshold: float = 0.3,
    consecutive_chunks: int = 3
) -> Dict[str, Any]:
    """
    リアルタイム脱線検知
    
    Args:
        recent_transcripts: 直近の文字起こし結果のリスト
        agenda_titles: アジェンダタイトルのリスト
        threshold: 類似度のしきい値
        consecutive_chunks: 連続して脱線と判定するチャンク数
        
    Returns:
        脱線検知結果の辞書
    """
    if not recent_transcripts or len(recent_transcripts) < consecutive_chunks:
        return {
            "is_deviation": False,
            "confidence": 0.0,
            "message": "データ不足",
            "suggested_agenda": []
        }
    
    # 直近の文字起こし結果を結合
    recent_text = " ".join([t.get("text", "") for t in recent_transcripts[-consecutive_chunks:]])
    
    if not recent_text.strip():
        return {
            "is_deviation": False,
            "confidence": 0.0,
            "message": "テキストが空",
            "suggested_agenda": []
        }
    
    # 各アジェンダとの類似度を計算
    similarities = []
    for agenda in agenda_titles:
        sim = similarity(recent_text, agenda)
        similarities.append((sim, agenda))
    
    # 最高類似度を取得
    similarities.sort(reverse=True)
    best_similarity, best_agenda = similarities[0] if similarities else (0.0, "")
    
    # 脱線判定
    is_deviation = best_similarity < threshold
    
    # 推奨アジェンダ（類似度上位2つ）
    suggested_agenda = [agenda for _, agenda in similarities[:2]]
    
    # メッセージ生成
    if is_deviation:
        message = f"直近{consecutive_chunks}回の発話がアジェンダ「{best_agenda}」との類似度が低い状態です（{best_similarity:.2f}）"
    else:
        message = f"アジェンダ「{best_agenda}」に沿った発話です（類似度: {best_similarity:.2f}）"
    
    logger.info(f"脱線検知結果: is_deviation={is_deviation}, similarity={best_similarity:.2f}, agenda={best_agenda}")
    
    return {
        "is_deviation": is_deviation,
        "confidence": 1.0 - best_similarity,  # 脱線の確信度
        "similarity_score": best_similarity,
        "best_agenda": best_agenda,
        "message": message,
        "suggested_agenda": suggested_agenda,
        "recent_text": recent_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
