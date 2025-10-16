#!/usr/bin/env python3
"""
Whisper.cppの動作テストスクリプト
"""

import os
import subprocess
import sys
from pathlib import Path

def test_whisper_cpp():
    """Whisper.cppの動作をテストする"""
    print("Whisper.cpp動作テスト開始...")
    
    # 現在のディレクトリを確認
    current_dir = os.getcwd()
    print(f"現在のディレクトリ: {current_dir}")
    
    # 実行ファイルの存在確認
    main_exe = "./main.exe"
    if os.path.exists(main_exe):
        print(f"実行ファイル発見: {main_exe}")
    else:
        print(f"実行ファイルが見つかりません: {main_exe}")
        return False
    
    # モデルファイルの存在確認
    model_path = "./whisper-cpp/models/ggml-base.bin"
    if os.path.exists(model_path):
        print(f"モデルファイル発見: {model_path}")
    else:
        print(f"モデルファイルが見つかりません: {model_path}")
        return False
    
    # テスト用音声ファイルの確認
    test_audio = "./sample2.wav"
    if os.path.exists(test_audio):
        print(f"テスト音声ファイル発見: {test_audio}")
    else:
        print(f"テスト音声ファイルが見つかりません: {test_audio}")
        print("既存の音声ファイルを探します...")
        
        # 既存の音声ファイルを探す
        audio_files = []
        for ext in ['*.wav', '*.mp3', '*.m4a']:
            audio_files.extend(Path('.').glob(ext))
        
        if audio_files:
            test_audio = str(audio_files[0])
            print(f"音声ファイルを使用: {test_audio}")
        else:
            print("音声ファイルが見つかりません")
            return False
    
    # Whisper.cppのヘルプを表示
    print("\nWhisper.cppヘルプを表示...")
    try:
        result = subprocess.run([main_exe, "--help"], 
                              capture_output=True, 
                              text=True, 
                              timeout=10)
        if result.returncode == 0:
            print("Whisper.cppヘルプ取得成功")
            print("ヘルプ内容（最初の10行）:")
            help_lines = result.stdout.split('\n')[:10]
            for line in help_lines:
                print(f"   {line}")
        else:
            print(f"ヘルプ表示でエラー: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("ヘルプ表示がタイムアウトしました")
    except Exception as e:
        print(f"ヘルプ表示でエラー: {e}")
    
    # 実際の音声ファイルでテスト
    print(f"\n音声ファイルでテスト実行: {test_audio}")
    try:
        cmd = [
            main_exe,
            "-m", model_path,
            "-f", test_audio,
            "-l", "ja",
            "-t", "0",
            "-nt"  # テキストのみ出力
        ]
        
        print(f"実行コマンド: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, 
                              capture_output=True, 
                              text=True, 
                              timeout=60)
        
        if result.returncode == 0:
            print("音声認識成功!")
            print("認識結果:")
            if result.stdout.strip():
                print(f"   {result.stdout.strip()}")
            else:
                print("   (出力なし)")
        else:
            print(f"音声認識失敗: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("音声認識がタイムアウトしました（60秒）")
        return False
    except Exception as e:
        print(f"音声認識でエラー: {e}")
        return False
    
    print("\nWhisper.cpp動作テスト完了!")
    return True

if __name__ == "__main__":
    success = test_whisper_cpp()
    sys.exit(0 if success else 1)
