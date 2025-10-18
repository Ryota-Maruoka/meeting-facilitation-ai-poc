"""
AI脱線検知機能のテストスクリプト

使用方法:
python test_ai_deviation.py
"""

import asyncio
import json
from datetime import datetime, timezone

from app.services.ai_deviation import ai_deviation_service


async def test_ai_deviation():
    """AI脱線検知機能をテスト"""
    
    print("🤖 AI脱線検知機能テスト開始")
    print("=" * 50)
    
    # テストデータ
    agenda_titles = [
        "プロジェクトの進捗確認",
        "技術的な課題の解決策検討", 
        "次回リリースの計画",
        "チーム体制の見直し"
    ]
    
    # テストケース1: アジェンダに沿った発話
    print("\n📝 テストケース1: アジェンダに沿った発話")
    transcripts_on_track = [
        {
            "text": "プロジェクトの進捗について報告します。現在、開発は予定通り進んでおり、来週までに基本機能の実装が完了する見込みです。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "技術的な課題として、データベースのパフォーマンス問題があります。インデックスの最適化を検討する必要があります。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result1 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_on_track,
        agenda_titles=agenda_titles,
        threshold=0.3,
        consecutive_chunks=2
    )
    
    print(f"結果: {result1.is_deviation}")
    print(f"信頼度: {result1.confidence:.2f}")
    print(f"類似度: {result1.similarity_score:.2f}")
    print(f"最適アジェンダ: {result1.best_agenda}")
    print(f"メッセージ: {result1.message}")
    print(f"推奨アジェンダ: {result1.suggested_agenda}")
    print(f"理由: {result1.reasoning}")
    
    # テストケース2: 脱線した発話
    print("\n📝 テストケース2: 脱線した発話")
    transcripts_deviation = [
        {
            "text": "昨日のサッカーの試合はすごかったですね。日本代表が3-1で勝利しました。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "そうですね、久保建英選手のゴールが特に印象的でした。来年のワールドカップが楽しみです。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result2 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_deviation,
        agenda_titles=agenda_titles,
        threshold=0.3,
        consecutive_chunks=2
    )
    
    print(f"結果: {result2.is_deviation}")
    print(f"信頼度: {result2.confidence:.2f}")
    print(f"類似度: {result2.similarity_score:.2f}")
    print(f"最適アジェンダ: {result2.best_agenda}")
    print(f"メッセージ: {result2.message}")
    print(f"推奨アジェンダ: {result2.suggested_agenda}")
    print(f"理由: {result2.reasoning}")
    
    # テストケース3: 境界線上の発話
    print("\n📝 テストケース3: 境界線上の発話")
    transcripts_boundary = [
        {
            "text": "チームのモチベーションについて話したいのですが、最近残業が多くて疲れているメンバーがいます。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "チーム体制の見直しが必要かもしれません。ワークライフバランスを考慮したスケジュール調整を検討しましょう。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result3 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_boundary,
        agenda_titles=agenda_titles,
        threshold=0.3,
        consecutive_chunks=2
    )
    
    print(f"結果: {result3.is_deviation}")
    print(f"信頼度: {result3.confidence:.2f}")
    print(f"類似度: {result3.similarity_score:.2f}")
    print(f"最適アジェンダ: {result3.best_agenda}")
    print(f"メッセージ: {result3.message}")
    print(f"推奨アジェンダ: {result3.suggested_agenda}")
    print(f"理由: {result3.reasoning}")
    
    print("\n" + "=" * 50)
    print("✅ AI脱線検知機能テスト完了")


async def test_fallback_mode():
    """フォールバックモードのテスト"""
    
    print("\n🔄 フォールバックモードテスト")
    print("=" * 30)
    
    # Azure OpenAI設定を無効化してフォールバックモードをテスト
    original_endpoint = ai_deviation_service.azure_endpoint
    ai_deviation_service.azure_endpoint = ""
    ai_deviation_service.stub_mode = True
    
    try:
        agenda_titles = ["プロジェクト進捗", "技術課題"]
        transcripts = [
            {"text": "プロジェクトの進捗について報告します", "timestamp": datetime.now(timezone.utc).isoformat()}
        ]
        
        result = await ai_deviation_service.check_deviation(
            recent_transcripts=transcripts,
            agenda_titles=agenda_titles,
            threshold=0.3,
            consecutive_chunks=1
        )
        
        print(f"フォールバック結果: {result.is_deviation}")
        print(f"理由: {result.reasoning}")
        
    finally:
        # 設定を元に戻す
        ai_deviation_service.azure_endpoint = original_endpoint
        ai_deviation_service.stub_mode = False


if __name__ == "__main__":
    print("🚀 AI脱線検知機能テストスクリプト")
    print("Azure OpenAI設定を確認してください...")
    
    # 設定確認
    from app.settings import settings
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        print("✅ Azure OpenAI設定が検出されました")
        print(f"エンドポイント: {settings.azure_openai_endpoint}")
        print(f"デプロイメント: {settings.azure_openai_deployment}")
    else:
        print("⚠️  Azure OpenAI設定が不完全です。フォールバックモードで動作します。")
    
    # テスト実行
    asyncio.run(test_ai_deviation())
    asyncio.run(test_fallback_mode())
