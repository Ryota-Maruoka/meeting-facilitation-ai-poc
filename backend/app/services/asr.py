from typing import List, Dict

# Stub ASR: In real deployment call Whisper API/whisper.cpp

def transcribe_audio(content: bytes, chunk_seconds: int = 30) -> List[Dict]:
    # For PoC, return a single chunk with placeholder text
    # Assume mono/16kHz; we don't actually decode here
    text = "[ASR placeholder] 会議音声のサンプルです。JWT検討について話しています。"
    return [
        {"text": text, "start_sec": 0.0, "end_sec": float(chunk_seconds), "speaker": None}
    ]
