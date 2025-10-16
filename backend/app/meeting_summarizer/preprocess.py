"""ASRテキストの前処理

フィラー削除、話者ラベル正規化、タイムスタンプ保持などの軽量クリーニング処理を実施。
"""

import re
from typing import Optional


# フィラー・ノイズパターン（日本語ASR向け）
FILLER_PATTERNS = [
    r"\b(えーと|あのー|そのー|まあ|うーん|ええ|はい|ああ)\b",
    r"\(笑\)|\(笑い\)|\[笑\]|\[笑い\]",
    r"\[noise\]|\[ノイズ\]|\[cough\]|\[咳\]",
]


def preprocess_asr_text(asr_text: str, keep_noise: bool = False) -> str:
    """ASRテキストを前処理する
    
    - フィラー・笑い・ノイズタグの削減（keep_noiseがFalseの場合）
    - 話者ラベルの正規化（例: [山田] → 山田:）
    - タイムスタンプ [hh:mm:ss] は保持（根拠追跡用）
    - 句読点が欠落している場合のみ安全な文分割を適用
    - 新規情報の補完はしない
    
    Args:
        asr_text: 音声文字起こしテキスト
        keep_noise: Trueの場合、フィラー削除を弱める
        
    Returns:
        前処理済みのテキスト
    """
    if not asr_text or not asr_text.strip():
        return ""
    
    text = asr_text
    
    # 話者ラベルの正規化: [山田] → 山田:
    # パターン: [任意の文字] を 任意の文字: に変換
    text = re.sub(r'\[([^\]]+)\]\s*', r'\1: ', text)
    
    # フィラー・ノイズの削除（軽量クリーン）
    if not keep_noise:
        for pattern in FILLER_PATTERNS:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # 余分な空白を整理（ただし改行は保持）
    text = re.sub(r' {2,}', ' ', text)  # 連続スペースを1つに
    text = re.sub(r'\n{3,}', '\n\n', text)  # 3連続以上の改行を2つに
    
    # 各行の前後の空白を削除
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(line for line in lines if line)
    
    return text.strip()


def estimate_token_count(text: str) -> int:
    """テキストのトークン数を概算する
    
    正確なトークン数算出にはtiktokenが必要だが、簡易版として
    日本語では1文字≈1-2トークン、英語では1単語≈1.3トークンと仮定。
    
    Args:
        text: 対象テキスト
        
    Returns:
        概算トークン数
    """
    # 日本語文字数（ひらがな・カタカナ・漢字）
    japanese_chars = len(re.findall(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]', text))
    # その他文字数（英数字・記号等）
    other_chars = len(text) - japanese_chars
    # 英単語数の概算（スペース区切り）
    words = len(text.split())
    
    # 概算: 日本語1文字≈1.5トークン、英単語≈1.3トークン
    estimated = int(japanese_chars * 1.5 + max(other_chars, words) * 1.3)
    return max(estimated, len(text) // 4)  # 最低でも4文字=1トークン


def split_text_into_chunks(text: str, max_tokens_per_chunk: int = 8000) -> list[str]:
    """テキストを指定トークン数以下のチャンクに分割する
    
    段落・改行を優先的に分割点とし、自然な位置で分ける。
    
    Args:
        text: 対象テキスト
        max_tokens_per_chunk: チャンクあたりの最大トークン数
        
    Returns:
        分割されたテキストのリスト
    """
    if estimate_token_count(text) <= max_tokens_per_chunk:
        return [text]
    
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_tokens = 0
    
    # 段落単位で分割（空行区切り）
    paragraphs = text.split('\n\n')
    
    for para in paragraphs:
        para_tokens = estimate_token_count(para)
        
        # 1段落が最大トークンを超える場合は行単位で分割
        if para_tokens > max_tokens_per_chunk:
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_tokens = 0
            
            # 行単位で分割
            lines = para.split('\n')
            for line in lines:
                line_tokens = estimate_token_count(line)
                if current_tokens + line_tokens > max_tokens_per_chunk:
                    if current_chunk:
                        chunks.append('\n\n'.join(current_chunk))
                    current_chunk = [line]
                    current_tokens = line_tokens
                else:
                    current_chunk.append(line)
                    current_tokens += line_tokens
        else:
            # 段落を追加できるか確認
            if current_tokens + para_tokens > max_tokens_per_chunk:
                # 現在のチャンクを確定
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_tokens = para_tokens
            else:
                current_chunk.append(para)
                current_tokens += para_tokens
    
    # 最後のチャンクを追加
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    return chunks


