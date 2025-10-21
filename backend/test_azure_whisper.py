#!/usr/bin/env python3
"""
Azure OpenAI Whisper API テストスクリプト

Azure OpenAI Whisper APIの動作確認を行う
"""

import asyncio
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.services.azure_whisper_service import transcribe_with_azure_whisper, transcribe_audio_data_azure_whisper
from app.settings import settings


async def test_azure_whisper_file():
    """ファイルベースのテスト"""
    print("=== Azure OpenAI Whisper API ファイルテスト ===")
    
    # 設定確認
    print(f"ASR Provider: {settings.asr_provider}")
    print(f"Azure OpenAI Endpoint: {settings.azure_whisper_endpoint}")
    print(f"Azure Whisper Deployment: {settings.azure_whisper_deployment}")
    print(f"Azure Whisper API Version: {settings.azure_whisper_api_version}")
    print(f"API Key設定: {'あり' if settings.azure_whisper_api_key else 'なし'}")
    
    if not settings.azure_whisper_endpoint or not settings.azure_whisper_api_key:
        print("❌ Azure Whisper設定が不完全です")
        return False
    
    # テスト用音声ファイル（存在する場合）
    test_files = [
        "sample_15m.wav",
        "sample2.wav",
        "test_audio.wav"
    ]
    
    test_file = None
    for file_name in test_files:
        if os.path.exists(file_name):
            test_file = file_name
            break
    
    if not test_file:
        print("❌ テスト用音声ファイルが見つかりません")
        print("以下のいずれかのファイルを配置してください:")
        for file_name in test_files:
            print(f"  - {file_name}")
        return False
    
    print(f"📁 テストファイル: {test_file}")
    
    try:
        # Azure Whisper APIで文字起こし
        result = await transcribe_with_azure_whisper(test_file)
        
        print("✅ 文字起こし成功!")
        print(f"📝 結果: {result.get('text', '')}")
        print(f"🌐 言語: {result.get('language', '')}")
        print(f"⏱️ 長さ: {result.get('duration', 0)}秒")
        
        # デバッグ: 全フィールドを表示
        print("\n🔍 デバッグ情報:")
        print(f"  全フィールド: {list(result.keys())}")
        print(f"  segments数: {len(result.get('segments', []))}")
        if result.get('segments'):
            print(f"  最初のセグメント: {result['segments'][0]}")
            print(f"  最後のセグメント: {result['segments'][-1]}")
        print(f"  生のduration値: {result.get('duration', 'NOT_FOUND')}")
        print(f"  生のlanguage値: {result.get('language', 'NOT_FOUND')}")
        
        return True
        
    except Exception as e:
        print(f"❌ 文字起こし失敗: {e}")
        return False


async def test_azure_whisper_data():
    """データベースのテスト"""
    print("\n=== Azure OpenAI Whisper API データテスト ===")
    
    # テスト用の音声データ（実際の音声ファイルから読み込み）
    test_files = [
        "sample_15m.wav",
        "sample2.wav",
        "test_audio.wav"
    ]
    
    test_file = None
    for file_name in test_files:
        if os.path.exists(file_name):
            test_file = file_name
            break
    
    if not test_file:
        print("❌ テスト用音声ファイルが見つかりません")
        return False
    
    try:
        # 音声ファイルを読み込み
        with open(test_file, "rb") as f:
            audio_data = f.read()
        
        print(f"📁 テストファイル: {test_file}")
        print(f"📊 データサイズ: {len(audio_data)} bytes")
        
        # Azure Whisper APIで文字起こし
        result = await transcribe_audio_data_azure_whisper(audio_data, test_file)
        
        print("✅ 文字起こし成功!")
        print(f"📝 結果: {result.get('text', '')}")
        print(f"🌐 言語: {result.get('language', '')}")
        print(f"⏱️ 長さ: {result.get('duration', 0)}秒")
        
        # デバッグ: 全フィールドを表示
        print("\n🔍 デバッグ情報:")
        print(f"  全フィールド: {list(result.keys())}")
        print(f"  segments数: {len(result.get('segments', []))}")
        if result.get('segments'):
            print(f"  最初のセグメント: {result['segments'][0]}")
            print(f"  最後のセグメント: {result['segments'][-1]}")
        print(f"  生のduration値: {result.get('duration', 'NOT_FOUND')}")
        print(f"  生のlanguage値: {result.get('language', 'NOT_FOUND')}")
        
        return True
        
    except Exception as e:
        print(f"❌ 文字起こし失敗: {e}")
        return False


async def main():
    """メインテスト"""
    print("🚀 Azure OpenAI Whisper API テスト開始")
    print("=" * 50)
    
    # ファイルテスト
    file_success = await test_azure_whisper_file()
    
    # データテスト
    data_success = await test_azure_whisper_data()
    
    print("\n" + "=" * 50)
    print("📊 テスト結果:")
    print(f"  ファイルテスト: {'✅ 成功' if file_success else '❌ 失敗'}")
    print(f"  データテスト: {'✅ 成功' if data_success else '❌ 失敗'}")
    
    if file_success and data_success:
        print("\n🎉 すべてのテストが成功しました!")
        print("Azure OpenAI Whisper APIが正常に動作しています。")
    else:
        print("\n⚠️ 一部のテストが失敗しました。")
        print("設定を確認してください。")
    
    return file_success and data_success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)