#!/usr/bin/env python3
"""
Python版Whisperセットアップスクリプト

音声文字起こし機能に必要なPythonライブラリを自動インストールします。
"""

import os
import subprocess
import sys
from pathlib import Path


def install_package(package_name: str, description: str) -> bool:
    """Pythonパッケージをインストールする"""
    try:
        print(f"📦 {description}をインストール中...")
        print(f"   パッケージ: {package_name}")
        
        # pipでインストール
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", package_name],
            capture_output=True,
            text=True,
            check=True
        )
        
        print(f"✅ インストール完了: {package_name}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ インストールエラー: {e}")
        print(f"   エラー出力: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False


def check_package(package_name: str, import_name: str = None) -> bool:
    """Pythonパッケージがインストールされているかチェック"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"✅ {package_name}は既にインストールされています")
        return True
    except ImportError:
        print(f"⚠️ {package_name}がインストールされていません")
        return False


def setup_python_whisper():
    """Python版Whisperのセットアップ"""
    print("🎤 Python版Whisperセットアップを開始します...")
    
    # 現在のディレクトリを確認
    current_dir = Path.cwd()
    print(f"📁 作業ディレクトリ: {current_dir}")
    
    success_count = 0
    total_count = 0
    
    # 1. PyTorchのインストール確認
    total_count += 1
    print(f"\n[{total_count}/3] PyTorchライブラリをチェック中...")
    if not check_package("torch"):
        if install_package("torch", "PyTorchライブラリ"):
            success_count += 1
    else:
        success_count += 1
    
    # 2. Whisperライブラリのインストール確認
    total_count += 1
    print(f"\n[{total_count}/3] Whisperライブラリをチェック中...")
    if not check_package("openai-whisper", "whisper"):
        if install_package("openai-whisper", "OpenAI Whisperライブラリ"):
            success_count += 1
    else:
        success_count += 1
    
    # 3. 動作テスト
    total_count += 1
    print(f"\n[{total_count}/3] Python版Whisperの動作テスト中...")
    try:
        import whisper
        print(f"📋 Whisperバージョン: {whisper.__version__}")
        
        # 小さなモデルでテスト
        print("🔍 モデルロードテスト中...")
        model = whisper.load_model("tiny")
        print("✅ モデルロード成功")
        
        success_count += 1
        
    except Exception as e:
        print(f"❌ 動作テストエラー: {e}")
    
    # 結果表示
    print(f"\n📊 セットアップ結果: {success_count}/{total_count} 成功")
    
    if success_count == total_count:
        print("🎉 Python版Whisperセットアップ完了!")
        
        # 環境変数ファイルを作成
        print("\n📝 環境設定ファイルを作成中...")
        env_content = """# Python版Whisper設定
ASR_PROVIDER=whisper_python
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
"""
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ .env ファイルを作成しました")
        
        print("\n📋 次のステップ:")
        print("1. バックエンドサーバーを起動: python run.py")
        print("2. 音声認識テストを実行: python test_whisper.py")
        print("3. フロントエンドを起動: cd ../frontend && npm run dev")
        
        return True
    else:
        print("❌ セットアップに失敗しました")
        print("手動でインストールしてください:")
        print("pip install openai-whisper torch")
        return False


def check_ffmpeg():
    """FFmpegの存在確認"""
    print("\n🔍 FFmpegの存在確認中...")
    
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print("✅ FFmpegがインストールされています")
            version_line = result.stdout.split('\n')[0]
            print(f"   バージョン: {version_line}")
            return True
        else:
            print("❌ FFmpegが正しくインストールされていません")
            return False
            
    except FileNotFoundError:
        print("❌ FFmpegが見つかりません")
        print("解決方法:")
        print("  Windows: https://ffmpeg.org/download.html")
        print("  macOS: brew install ffmpeg")
        print("  Ubuntu: sudo apt install ffmpeg")
        return False
    except subprocess.TimeoutExpired:
        print("⚠️ FFmpegの確認がタイムアウトしました")
        return False
    except Exception as e:
        print(f"❌ FFmpeg確認エラー: {e}")
        return False


def main():
    """メイン関数"""
    print("=" * 60)
    print("  🎤 Python版Whisperセットアップスクリプト")
    print("=" * 60)
    
    # Whisperセットアップ
    whisper_ok = setup_python_whisper()
    
    # FFmpeg確認
    ffmpeg_ok = check_ffmpeg()
    
    print("\n" + "=" * 60)
    if whisper_ok and ffmpeg_ok:
        print("🎉 すべてのセットアップが完了しました!")
        print("✅ Python版Whisper: 準備完了")
        print("✅ FFmpeg: 準備完了")
    elif whisper_ok:
        print("⚠️ Whisperは準備完了ですが、FFmpegが必要です")
        print("✅ Python版Whisper: 準備完了")
        print("❌ FFmpeg: 未インストール")
    else:
        print("❌ セットアップに失敗しました")
        print("❌ Python版Whisper: セットアップ失敗")
        print("❌ FFmpeg: 確認できません")
    
    print("=" * 60)


if __name__ == "__main__":
    main()