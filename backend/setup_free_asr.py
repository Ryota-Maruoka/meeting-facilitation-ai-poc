#!/usr/bin/env python3
"""
無料ASRセットアップスクリプト

Whisper.cppを自動的にダウンロード・セットアップします
"""

import os
import sys
import subprocess
import urllib.request
import zipfile
import shutil
from pathlib import Path


def download_file(url: str, filename: str) -> str:
    """ファイルをダウンロード"""
    print(f"Downloading {filename}...")
    urllib.request.urlretrieve(url, filename)
    return filename


def extract_zip(zip_path: str, extract_to: str):
    """ZIPファイルを展開"""
    print(f"Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)


def setup_whisper_cpp():
    """Whisper.cppをセットアップ"""
    print("🆓 無料ASR（Whisper.cpp）セットアップを開始します...")
    
    # 作業ディレクトリを作成
    whisper_dir = Path("whisper-cpp")
    whisper_dir.mkdir(exist_ok=True)
    
    try:
        # 1. Whisper.cppのリリースをダウンロード
        print("1. Whisper.cppをダウンロード中...")
        
        # Windows用の最新リリース（例：v1.5.4）
        release_url = "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"
        zip_file = "whisper-bin-x64.zip"
        
        if not os.path.exists(zip_file):
            download_file(release_url, zip_file)
        
        # 2. 展開
        print("2. ファイルを展開中...")
        extract_zip(zip_file, ".")
        
        # 3. モデルファイルをダウンロード
        print("3. モデルファイルをダウンロード中...")
        models_dir = whisper_dir / "models"
        models_dir.mkdir(exist_ok=True)
        
        # ベースモデル（約1.5GB）
        model_url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
        model_file = models_dir / "ggml-base.bin"
        
        if not model_file.exists():
            print("モデルファイルをダウンロード中（約1.5GB）...")
            urllib.request.urlretrieve(model_url, model_file)
        
        # 4. 環境変数ファイルを作成
        print("4. 環境設定ファイルを作成中...")
        env_content = f"""# 無料ASR設定
ASR_PROVIDER=whisper_cpp
WHISPER_EXECUTABLE_PATH={whisper_dir.absolute()}/whisper.exe
WHISPER_MODEL_PATH={model_file.absolute()}
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
"""
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        
        # 5. テスト実行
        print("5. セットアップをテスト中...")
        whisper_exe = whisper_dir / "whisper.exe"
        
        if whisper_exe.exists():
            # バージョン確認
            result = subprocess.run([str(whisper_exe), "--help"], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print("✅ Whisper.cppのセットアップが完了しました！")
                print(f"実行ファイル: {whisper_exe}")
                print(f"モデルファイル: {model_file}")
                return True
            else:
                print("❌ Whisper.cppのテストに失敗しました")
                return False
        else:
            print("❌ Whisper.cppの実行ファイルが見つかりません")
            return False
            
    except Exception as e:
        print(f"❌ セットアップエラー: {e}")
        return False
    
    finally:
        # 一時ファイルを削除
        if os.path.exists(zip_file):
            os.remove(zip_file)


def setup_alternative_asr():
    """代替の無料ASRオプション"""
    print("\n🔄 代替の無料ASRオプション:")
    print("1. ブラウザのWeb Speech API（フロントエンド）")
    print("2. オフライン音声認識ライブラリ")
    print("3. スタブ実装（開発用）")
    
    # スタブ実装の設定
    env_content = """# スタブASR設定（開発用）
ASR_PROVIDER=stub
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
"""
    
    with open(".env", "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print("✅ スタブ実装に設定しました（開発用）")


def main():
    """メイン関数"""
    print("🎤 無料ASRセットアップツール")
    print("=" * 50)
    
    # 現在のディレクトリを確認
    if not os.path.exists("app"):
        print("❌ バックエンドディレクトリで実行してください")
        sys.exit(1)
    
    print("選択してください:")
    print("1. Whisper.cpp（推奨、約1.5GB）")
    print("2. スタブ実装（開発用）")
    
    choice = input("選択 (1 or 2): ").strip()
    
    if choice == "1":
        success = setup_whisper_cpp()
        if not success:
            print("\n⚠️ Whisper.cppのセットアップに失敗しました")
            setup_alternative_asr()
    elif choice == "2":
        setup_alternative_asr()
    else:
        print("無効な選択です")
        sys.exit(1)
    
    print("\n🎉 セットアップ完了！")
    print("バックエンドサーバーを起動してください:")
    print("python run.py")


if __name__ == "__main__":
    main()
