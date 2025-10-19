#!/usr/bin/env python3
"""
Python版Whisperの動作テストスクリプト
"""

import os
import sys
import tempfile
from pathlib import Path


def test_python_whisper():
    """Python版Whisperの動作をテストする"""
    print("Python版Whisper動作テスト開始...")
    
    # 現在のディレクトリを確認
    current_dir = os.getcwd()
    print(f"現在のディレクトリ: {current_dir}")
    
    # Whisperライブラリの存在確認
    try:
        import whisper
        print("✅ Whisperライブラリがインストールされています")
    except ImportError:
        print("❌ Whisperライブラリがインストールされていません")
        print("解決方法: pip install openai-whisper")
        return False
    
    # テスト用音声ファイルの確認
    test_audio = "./sample2.wav"
    if os.path.exists(test_audio):
        print(f"✅ テスト音声ファイル発見: {test_audio}")
    else:
        print(f"⚠️ テスト音声ファイルが見つかりません: {test_audio}")
        print("既存の音声ファイルを探します...")
        
        # 既存の音声ファイルを探す
        audio_files = []
        for ext in ['*.wav', '*.mp3', '*.m4a', '*.webm']:
            audio_files.extend(Path('.').glob(ext))
        
        if audio_files:
            test_audio = str(audio_files[0])
            print(f"✅ 音声ファイルを使用: {test_audio}")
        else:
            print("❌ 音声ファイルが見つかりません")
            print("解決方法: テスト用の音声ファイルを配置してください")
            return False
    
    # Python版Whisperでテスト実行
    print(f"\n🎤 音声ファイルでテスト実行: {test_audio}")
    try:
        import whisper
        import torch
        
        # Whisperモデルをロード
        print("📥 Whisperモデル（tiny）をロード中...")
        model = whisper.load_model("tiny")
        print("✅ モデルロード完了")
        
        # 音声を文字起こし
        print("🎯 音声認識実行中...")
        result = model.transcribe(test_audio, language="ja")
        
        print("✅ 音声認識成功!")
        print("📝 認識結果:")
        if result.get("text", "").strip():
            print(f"   {result['text'].strip()}")
        else:
            print("   (出力なし)")
        
        # セグメント情報も表示
        if "segments" in result and result["segments"]:
            print("\n📊 セグメント情報:")
            for i, segment in enumerate(result["segments"][:3]):  # 最初の3セグメントのみ
                start_time = segment.get("start", 0)
                end_time = segment.get("end", 0)
                text = segment.get("text", "").strip()
                print(f"   [{i+1}] {start_time:.1f}s-{end_time:.1f}s: {text}")
        
        return True
        
    except Exception as e:
        print(f"❌ 音声認識でエラー: {e}")
        print(f"エラー詳細: {type(e).__name__}")
        return False


def test_whisper_import():
    """Whisperライブラリのインポートテスト"""
    print("\n🔍 Whisperライブラリのインポートテスト...")
    
    try:
        import whisper
        print("✅ whisper インポート成功")
        
        import torch
        print("✅ torch インポート成功")
        
        # バージョン情報を表示
        print(f"📋 Whisperバージョン: {whisper.__version__}")
        print(f"📋 PyTorchバージョン: {torch.__version__}")
        
        # CUDAの利用可能性を確認
        if torch.cuda.is_available():
            print(f"🚀 CUDA利用可能: {torch.cuda.get_device_name(0)}")
        else:
            print("💻 CPUモードで実行")
        
        return True
        
    except ImportError as e:
        print(f"❌ インポートエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("  Python版Whisper動作テスト")
    print("=" * 50)
    
    # インポートテスト
    import_ok = test_whisper_import()
    
    if not import_ok:
        print("\n❌ インポートテストに失敗しました")
        print("解決方法:")
        print("1. pip install openai-whisper")
        print("2. pip install torch")
        sys.exit(1)
    
    # 実際の音声認識テスト
    test_ok = test_python_whisper()
    
    print("\n" + "=" * 50)
    if test_ok:
        print("🎉 Python版Whisper動作テスト完了!")
        print("✅ すべてのテストが成功しました")
    else:
        print("❌ Python版Whisper動作テストに失敗しました")
        print("解決方法:")
        print("1. 音声ファイルが正しい形式か確認")
        print("2. Whisperライブラリが正しくインストールされているか確認")
        print("3. システムリソース（メモリ）が十分か確認")
    
    print("=" * 50)
    sys.exit(0 if test_ok else 1)