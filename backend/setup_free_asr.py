#!/usr/bin/env python3
"""
無料ASRセットアップスクリプト

Python版Whisperを自動的にセットアップします
"""

import os
import sys
import subprocess


def setup_python_whisper():
    """Python版Whisperをセットアップ"""
    print("🆓 無料ASR（Python版Whisper）セットアップを開始します...")
    
    try:
        # 1. Whisperライブラリのインストール確認
        print("1. Python版Whisperライブラリをチェック中...")
        
        try:
            import whisper
            print("✅ Whisperライブラリは既にインストールされています")
            print(f"   バージョン: {whisper.__version__}")
        except ImportError:
            print("📦 Whisperライブラリをインストール中...")
            subprocess.run([sys.executable, "-m", "pip", "install", "openai-whisper"], check=True)
            print("✅ Whisperライブラリのインストール完了")
        
        # 2. PyTorchの確認
        print("2. PyTorchライブラリをチェック中...")
        try:
            import torch
            print("✅ PyTorchライブラリは既にインストールされています")
            print(f"   バージョン: {torch.__version__}")
            
            if torch.cuda.is_available():
                print(f"🚀 CUDA利用可能: {torch.cuda.get_device_name(0)}")
            else:
                print("💻 CPUモードで実行")
                
        except ImportError:
            print("📦 PyTorchライブラリをインストール中...")
            subprocess.run([sys.executable, "-m", "pip", "install", "torch"], check=True)
            print("✅ PyTorchライブラリのインストール完了")
        
        # 3. テスト実行
        print("3. Python版Whisperの動作テスト中...")
        try:
            import whisper
            model = whisper.load_model("tiny")
            print("✅ Python版Whisperの動作確認完了")
        except Exception as e:
            print(f"⚠️ 動作テストでエラー: {e}")
            return False
        
        # 4. 環境変数ファイルを作成
        print("4. 環境設定ファイルを作成中...")
        env_content = """# 無料ASR設定（Python版Whisper）
ASR_PROVIDER=whisper_python
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
"""
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ .env ファイルを作成しました")
        
        print("\n🎉 Python版Whisperセットアップ完了!")
        print("📋 次のステップ:")
        print("1. バックエンドサーバーを起動: python run.py")
        print("2. 音声認識テストを実行: python test_whisper.py")
        print("3. フロントエンドを起動: cd ../frontend && npm run dev")
        
        return True
        
    except Exception as e:
        print(f"❌ セットアップエラー: {e}")
        return False


def setup_alternative_asr():
    """代替ASR（スタブ実装）をセットアップ"""
    print("🆓 代替ASR（スタブ実装）セットアップを開始します...")
    
    try:
        # 環境変数ファイルを作成
        print("1. 環境設定ファイルを作成中...")
        env_content = """# 代替ASR設定（スタブ実装）
ASR_PROVIDER=stub
ASR_LANGUAGE=ja
ASR_TEMPERATURE=0.0
"""
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ .env ファイルを作成しました")
        
        print("\n🎉 代替ASRセットアップ完了!")
        print("📋 次のステップ:")
        print("1. バックエンドサーバーを起動: python run.py")
        print("2. 音声認識テストを実行: python test_whisper.py")
        print("3. フロントエンドを起動: cd ../frontend && npm run dev")
        print("\n⚠️ 注意: スタブ実装は開発・テスト用です")
        
        return True
        
    except Exception as e:
        print(f"❌ セットアップエラー: {e}")
        return False


def main():
    """メイン関数"""
    print("=" * 60)
    print("  🎤 無料ASRセットアップスクリプト")
    print("=" * 60)
    print()
    print("利用可能なASRオプション:")
    print("1. Python版Whisper（推奨、約1GB）")
    print("2. スタブ実装（開発用）")
    print()
    
    choice = input("選択してください (1 or 2): ").strip()
    
    if choice == "1":
        success = setup_python_whisper()
        if not success:
            print("\n⚠️ Python版Whisperのセットアップに失敗しました")
            print("代替ASR（スタブ実装）をセットアップしますか？")
            fallback = input("代替ASRをセットアップしますか？ (y/n): ").strip().lower()
            if fallback == 'y':
                setup_alternative_asr()
    elif choice == "2":
        setup_alternative_asr()
    else:
        print("❌ 無効な選択です")
        sys.exit(1)
    
    print("\n🎉 セットアップ完了！")
    print("バックエンドサーバーを起動してください:")
    print("python run.py")


if __name__ == "__main__":
    main()