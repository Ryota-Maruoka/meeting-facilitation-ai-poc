"""
API経由でのAI脱線検知機能テストスクリプト

使用方法:
cd backend
python test_api_deviation.py
"""

import requests
import json
import time
from datetime import datetime, timezone


def test_api_deviation():
    """API経由でAI脱線検知機能をテスト"""
    
    print("🚀 API経由でのAI脱線検知機能テスト開始")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. ヘルスチェック
        print("\n1️⃣ ヘルスチェック")
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ サーバーが正常に動作しています")
        else:
            print("❌ サーバーが応答しません")
            return
        
        # 2. 会議を作成
        print("\n2️⃣ 会議を作成")
        meeting_data = {
            "title": "AI脱線検知テスト会議",
            "purpose": "AI脱線検知機能のテスト",
            "deliverable_template": "テスト結果",
            "participants": ["test@example.com"],
            "consent_recording": True,
            "agenda": [
                {"title": "プロジェクトの進捗確認"},
                {"title": "技術的な課題の解決策検討"},
                {"title": "次回リリースの計画"},
                {"title": "チーム体制の見直し"}
            ]
        }
        
        response = requests.post(f"{base_url}/meetings", json=meeting_data)
        if response.status_code == 201:
            meeting = response.json()
            meeting_id = meeting["id"]
            print(f"✅ 会議を作成しました: {meeting_id}")
        else:
            print(f"❌ 会議作成に失敗: {response.status_code} - {response.text}")
            return
        
        # 3. 文字起こしデータを追加（アジェンダに沿った発話）
        print("\n3️⃣ アジェンダに沿った発話を追加")
        transcript_data = {
            "text": "プロジェクトの進捗について報告します。現在、開発は予定通り進んでおり、来週までに基本機能の実装が完了する見込みです。技術的な課題として、データベースのパフォーマンス問題があります。",
            "start_sec": 0.0,
            "end_sec": 60.0,
            "speaker": None
        }
        
        response = requests.post(f"{base_url}/meetings/{meeting_id}/transcripts", json=transcript_data)
        if response.status_code == 200:
            print("✅ アジェンダに沿った発話を追加しました")
        else:
            print(f"❌ 文字起こし追加に失敗: {response.status_code} - {response.text}")
        
        # 4. 脱線検知を実行（アジェンダに沿った発話）
        print("\n4️⃣ 脱線検知を実行（アジェンダに沿った発話）")
        response = requests.post(f"{base_url}/meetings/{meeting_id}/deviation/check")
        if response.status_code == 200:
            deviation_result = response.json()
            print("=== 脱線検知結果（アジェンダに沿った発話） ===")
            print(f"脱線判定: {deviation_result['is_deviation']}")
            print(f"信頼度: {deviation_result['confidence']:.2f}")
            print(f"類似度: {deviation_result['similarity_score']:.2f}")
            print(f"最適アジェンダ: {deviation_result['best_agenda']}")
            print(f"メッセージ: {deviation_result['message']}")
            print(f"推奨アジェンダ: {deviation_result['suggested_agenda']}")
            if 'reasoning' in deviation_result:
                print(f"理由: {deviation_result['reasoning']}")
        else:
            print(f"❌ 脱線検知に失敗: {response.status_code} - {response.text}")
        
        # 5. 脱線した発話を追加
        print("\n5️⃣ 脱線した発話を追加")
        deviation_transcript = {
            "text": "昨日のサッカーの試合はすごかったですね。日本代表が3-1で勝利しました。久保建英選手のゴールが特に印象的でした。来年のワールドカップが楽しみです。",
            "start_sec": 60.0,
            "end_sec": 120.0,
            "speaker": None
        }
        
        response = requests.post(f"{base_url}/meetings/{meeting_id}/transcripts", json=deviation_transcript)
        if response.status_code == 200:
            print("✅ 脱線した発話を追加しました")
        else:
            print(f"❌ 文字起こし追加に失敗: {response.status_code} - {response.text}")
        
        # 6. 脱線検知を実行（脱線した発話）
        print("\n6️⃣ 脱線検知を実行（脱線した発話）")
        response = requests.post(f"{base_url}/meetings/{meeting_id}/deviation/check")
        if response.status_code == 200:
            deviation_result = response.json()
            print("=== 脱線検知結果（脱線した発話） ===")
            print(f"脱線判定: {deviation_result['is_deviation']}")
            print(f"信頼度: {deviation_result['confidence']:.2f}")
            print(f"類似度: {deviation_result['similarity_score']:.2f}")
            print(f"最適アジェンダ: {deviation_result['best_agenda']}")
            print(f"メッセージ: {deviation_result['message']}")
            print(f"推奨アジェンダ: {deviation_result['suggested_agenda']}")
            if 'reasoning' in deviation_result:
                print(f"理由: {deviation_result['reasoning']}")
        else:
            print(f"❌ 脱線検知に失敗: {response.status_code} - {response.text}")
        
        # 7. 境界線上の発話を追加
        print("\n7️⃣ 境界線上の発話を追加")
        boundary_transcript = {
            "text": "チームのモチベーションについて話したいのですが、最近残業が多くて疲れているメンバーがいます。チーム体制の見直しが必要かもしれません。ワークライフバランスを考慮したスケジュール調整を検討しましょう。",
            "start_sec": 120.0,
            "end_sec": 180.0,
            "speaker": None
        }
        
        response = requests.post(f"{base_url}/meetings/{meeting_id}/transcripts", json=boundary_transcript)
        if response.status_code == 200:
            print("✅ 境界線上の発話を追加しました")
        else:
            print(f"❌ 文字起こし追加に失敗: {response.status_code} - {response.text}")
        
        # 8. 脱線検知を実行（境界線上の発話）
        print("\n8️⃣ 脱線検知を実行（境界線上の発話）")
        response = requests.post(f"{base_url}/meetings/{meeting_id}/deviation/check")
        if response.status_code == 200:
            deviation_result = response.json()
            print("=== 脱線検知結果（境界線上の発話） ===")
            print(f"脱線判定: {deviation_result['is_deviation']}")
            print(f"信頼度: {deviation_result['confidence']:.2f}")
            print(f"類似度: {deviation_result['similarity_score']:.2f}")
            print(f"最適アジェンダ: {deviation_result['best_agenda']}")
            print(f"メッセージ: {deviation_result['message']}")
            print(f"推奨アジェンダ: {deviation_result['suggested_agenda']}")
            if 'reasoning' in deviation_result:
                print(f"理由: {deviation_result['reasoning']}")
        else:
            print(f"❌ 脱線検知に失敗: {response.status_code} - {response.text}")
        
        print("\n" + "=" * 50)
        print("✅ API経由でのAI脱線検知機能テスト完了")
        
    except requests.exceptions.ConnectionError:
        print("❌ サーバーに接続できません。バックエンドサーバーが起動しているか確認してください。")
        print("   起動コマンド: cd backend && python run.py server")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")


if __name__ == "__main__":
    print("🔧 API経由でのAI脱線検知機能テスト")
    print("バックエンドサーバーが起動していることを確認してください...")
    print("起動コマンド: cd backend && python run.py server")
    print()
    
    test_api_deviation()
