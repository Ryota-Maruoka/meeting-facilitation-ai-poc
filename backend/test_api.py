#!/usr/bin/env python3
"""
API接続テストスクリプト
"""

import requests
import json

def test_api_connection():
    """API接続をテストする"""
    print("API接続テスト開始...")
    
    # ヘルスチェック
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ ヘルスチェック成功:", response.json())
        else:
            print(f"❌ ヘルスチェック失敗: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")
        return False
    
    # 会議作成APIテスト
    try:
        test_data = {
            "title": "テスト会議",
            "purpose": "テスト目的",
            "deliverable_template": "テスト成果物",
            "participants": [],
            "consent_recording": False
        }
        
        print(f"\n会議作成APIテスト...")
        print(f"送信データ: {json.dumps(test_data, ensure_ascii=False)}")
        
        response = requests.post(
            "http://localhost:8000/meetings",
            headers={"Content-Type": "application/json"},
            json=test_data
        )
        
        if response.status_code == 201:
            result = response.json()
            print("✅ 会議作成成功!")
            print(f"作成された会議ID: {result.get('id')}")
            return True
        else:
            print(f"❌ 会議作成失敗: {response.status_code}")
            print(f"エラー内容: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 会議作成エラー: {e}")
        return False

if __name__ == "__main__":
    success = test_api_connection()
    if success:
        print("\n🎉 API接続テスト完了!")
    else:
        print("\n❌ API接続テスト失敗")
