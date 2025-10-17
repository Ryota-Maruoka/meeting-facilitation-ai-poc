#!/usr/bin/env python3
"""
Whisper.cppセットアップスクリプト

音声文字起こし機能に必要なファイルを自動ダウンロードします。
"""

import os
import urllib.request
import sys
from pathlib import Path


def download_file(url: str, filepath: str, description: str) -> bool:
    """ファイルをダウンロードする"""
    try:
        print(f"📥 {description}をダウンロード中...")
        print(f"   URL: {url}")
        print(f"   保存先: {filepath}")
        
        # ディレクトリを作成
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # ファイルをダウンロード
        urllib.request.urlretrieve(url, filepath)
        
        # ファイルサイズを確認
        file_size = os.path.getsize(filepath)
        print(f"✅ ダウンロード完了: {file_size:,} bytes")
        return True
        
    except Exception as e:
        print(f"❌ ダウンロードエラー: {e}")
        return False


def setup_whisper_cpp():
    """Whisper.cppのセットアップ"""
    print("🎤 Whisper.cppセットアップを開始します...")
    
    # 現在のディレクトリを確認
    current_dir = Path.cwd()
    print(f"📁 作業ディレクトリ: {current_dir}")
    
    # 1. モデルファイルのダウンロード
    model_url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
    model_path = "whisper-cpp/models/ggml-base.bin"
    
    if os.path.exists(model_path):
        print(f"✅ モデルファイルは既に存在します: {model_path}")
    else:
        success = download_file(
            model_url, 
            model_path, 
            "Whisperモデルファイル（ggml-base.bin, 約1.5GB）"
        )
        if not success:
            print("❌ モデルファイルのダウンロードに失敗しました")
            return False
    
    # 2. 実行ファイルの確認
    main_exe = "main.exe"
    if os.path.exists(main_exe):
        print(f"✅ 実行ファイルは既に存在します: {main_exe}")
    else:
        print("⚠️ 実行ファイル（main.exe）が見つかりません")
        print("   以下のURLから手動でダウンロードしてください:")
        print("   https://github.com/ggerganov/whisper.cpp/releases")
        print("   Windows版の最新リリースをダウンロードして、backend/ディレクトリに配置してください")
        print("\n   📋 ダウンロード手順:")
        print("   1. 上記URLにアクセス")
        print("   2. 最新リリースの「Assets」を展開")
        print("   3. 「whisper-bin-win64.zip」をダウンロード")
        print("   4. 解凍して「main.exe」をbackend/ディレクトリに配置")
    
    # 3. セットアップ完了確認
    print("\n🎉 Whisper.cppセットアップ完了！")
    print("\n📋 次のステップ:")
    print("1. バックエンドサーバーを起動: python run.py")
    print("2. 音声認識テストを実行: python test_whisper.py")
    print("3. フロントエンドを起動: cd ../frontend && npm run dev")
    
    return True


def check_ffmpeg():
    """FFmpegの存在確認"""
    print("\n🔍 FFmpegの確認中...")
    
    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ FFmpegがインストールされています")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("❌ FFmpegが見つかりません")
    print("   以下のコマンドでインストールしてください:")
    print("   Windows: winget install Gyan.FFmpeg")
    print("   macOS: brew install ffmpeg")
    print("   Linux: sudo apt install ffmpeg")
    return False


if __name__ == "__main__":
    print("🚀 Meeting Facilitation AI PoC - Whisper.cppセットアップ")
    print("=" * 60)
    
    # FFmpegの確認
    ffmpeg_ok = check_ffmpeg()
    
    # Whisper.cppのセットアップ
    whisper_ok = setup_whisper_cpp()
    
    print("\n" + "=" * 60)
    if whisper_ok and ffmpeg_ok:
        print("🎉 セットアップが完了しました！")
        print("   音声文字起こし機能が使用できます。")
    else:
        print("⚠️ セットアップに問題があります。")
        print("   上記のエラーメッセージを確認してください。")
        sys.exit(1)
