"""
AI脱線検知機能のテストスクリプト

使用方法:
python test_ai_deviation.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.services.ai_deviation import ai_deviation_service


async def test_ai_deviation():
    """AI脱線検知機能をテスト"""
    
    print("🤖 AI脱線検知機能テスト開始")
    print("=" * 60)
    
    # テストデータ：アジェンダ項目（タイトル、期待成果物、所要時間を含む）
    agenda_items = [
        {
            "title": "認証方式の確認",
            "expectedOutcome": "JWTとMTLSの比較検討結果を決定する",
            "duration": 15
        },
        {
            "title": "API方針の確認",
            "expectedOutcome": "RESTful APIとGraphQLの採用方針を決定する",
            "duration": 20
        },
        {
            "title": "次回リリースの計画",
            "expectedOutcome": "リリーススケジュールとリリース候補機能を確定する",
            "duration": 10
        },
        {
            "title": "チーム体制の見直し",
            "expectedOutcome": "現在の体制の問題点を洗い出し、改善案を検討する",
            "duration": 15
        }
    ]
    
    # テストケース1: アジェンダに沿った発話（期待成果物も関連）
    print("\n📝 テストケース1: アジェンダに沿った発話（認証方式の議論）")
    print("-" * 60)
    transcripts_on_track = [
        {
            "text": "認証方式について検討します。JWTとMTLSを比較した結果、JWTの方が実装が簡単で運用負荷も低いことが分かりました。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "MTLSはセキュリティ面では優れていますが、証明書管理が複雑になるため、現時点ではJWTを採用する方向で進めます。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "JWTのトークン有効期限は24時間に設定し、リフレッシュトークンも実装する方針です。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"発話内容: {transcripts_on_track[0]['text']} ...")
    result1 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_on_track,
        agenda_items=agenda_items,
        threshold=0.3,
        consecutive_chunks=3
    )
    
    print(f"✅ 脱線判定: {'脱線' if result1.is_deviation else 'アジェンダに沿っている'}")
    print(f"📊 信頼度: {result1.confidence:.2f}")
    print(f"📊 関連度: {result1.similarity_score:.2f}")
    print(f"📌 最適アジェンダ: {result1.best_agenda}")
    print(f"💬 メッセージ: {result1.message}")
    print(f"🔍 判定理由:\n{result1.reasoning}")
    
    # テストケース2: 完全に脱線した発話（雑談）
    print("\n📝 テストケース2: 完全に脱線した発話（スポーツの雑談）")
    print("-" * 60)
    transcripts_deviation = [
        {
            "text": "昨日のサッカーの試合はすごかったですね。日本代表が3-1で勝利しました。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "そうですね、久保建英選手のゴールが特に印象的でした。来年のワールドカップが楽しみです。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "今度一緒にスタジアムに行きませんか？チケットが取れたので。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"発話内容: {transcripts_deviation[0]['text']} ...")
    result2 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_deviation,
        agenda_items=agenda_items,
        threshold=0.3,
        consecutive_chunks=3
    )
    
    print(f"✅ 脱線判定: {'脱線' if result2.is_deviation else 'アジェンダに沿っている'}")
    print(f"📊 信頼度: {result2.confidence:.2f}")
    print(f"📊 関連度: {result2.similarity_score:.2f}")
    print(f"📌 最適アジェンダ: {result2.best_agenda}")
    print(f"💬 メッセージ: {result2.message}")
    print(f"🔍 判定理由:\n{result2.reasoning}")
    
    # テストケース3: 期待成果物に関連するが議題タイトルとは異なる発話
    print("\n📝 テストケース3: 期待成果物に関連（チーム体制の見直し）")
    print("-" * 60)
    transcripts_related_outcome = [
        {
            "text": "最近残業が多くて疲れているメンバーが増えています。ワークライフバランスを考慮した体制の見直しが必要かもしれません。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "具体的には、タスクの優先順位付けを明確にして、不要な会議を減らすことで、残業時間を削減できると思います。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "改善案として、朝会の時間を短縮し、週1回の定例ミーティングに集約するのはどうでしょうか。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"発話内容: {transcripts_related_outcome[0]['text']} ...")
    result3 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_related_outcome,
        agenda_items=agenda_items,
        threshold=0.3,
        consecutive_chunks=3
    )
    
    print(f"✅ 脱線判定: {'脱線' if result3.is_deviation else 'アジェンダに沿っている'}")
    print(f"📊 信頼度: {result3.confidence:.2f}")
    print(f"📊 関連度: {result3.similarity_score:.2f}")
    print(f"📌 最適アジェンダ: {result3.best_agenda}")
    print(f"💬 メッセージ: {result3.message}")
    print(f"🔍 判定理由:\n{result3.reasoning}")
    
    # テストケース4: 技術的な議論だがアジェンダと無関係
    print("\n📝 テストケース4: 技術的な議論だがアジェンダと無関係")
    print("-" * 60)
    transcripts_unrelated_tech = [
        {
            "text": "Dockerのコンテナイメージのサイズを小さくする方法について話したいのですが、マルチステージビルドを使うのが効果的です。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": ".dockerignoreファイルを使って不要なファイルを除外することでも、イメージサイズを削減できます。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "Alpine Linuxベースのイメージを使うのも良い方法ですね。Debianベースと比べて軽量です。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"発話内容: {transcripts_unrelated_tech[0]['text']} ...")
    result4 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_unrelated_tech,
        agenda_items=agenda_items,
        threshold=0.3,
        consecutive_chunks=3
    )
    
    print(f"✅ 脱線判定: {'脱線' if result4.is_deviation else 'アジェンダに沿っている'}")
    print(f"📊 信頼度: {result4.confidence:.2f}")
    print(f"📊 関連度: {result4.similarity_score:.2f}")
    print(f"📌 最適アジェンダ: {result4.best_agenda}")
    print(f"💬 メッセージ: {result4.message}")
    print(f"🔍 判定理由:\n{result4.reasoning}")
    
    # テストケース5: 期待成果物に直接関連する発話
    print("\n📝 テストケース5: 期待成果物に直接関連する発話（リリース計画）")
    print("-" * 60)
    transcripts_release_plan = [
        {
            "text": "次回リリースのスケジュールについてですが、来月15日にリリース候補を確定し、20日に本番リリースを行う予定です。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "リリース候補機能として、認証機能の改善とAPIの新エンドポイント追加を予定しています。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "text": "ステークホルダーへの報告はリリース1週間前に行い、承認を得てからリリースを実施します。",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"発話内容: {transcripts_release_plan[0]['text']} ...")
    result5 = await ai_deviation_service.check_deviation(
        recent_transcripts=transcripts_release_plan,
        agenda_items=agenda_items,
        threshold=0.3,
        consecutive_chunks=3
    )
    
    print(f"✅ 脱線判定: {'脱線' if result5.is_deviation else 'アジェンダに沿っている'}")
    print(f"📊 信頼度: {result5.confidence:.2f}")
    print(f"📊 関連度: {result5.similarity_score:.2f}")
    print(f"📌 最適アジェンダ: {result5.best_agenda}")
    print(f"💬 メッセージ: {result5.message}")
    print(f"🔍 判定理由:\n{result5.reasoning}")
    
    # テスト結果のサマリ
    print("\n" + "=" * 60)
    print("📊 テスト結果サマリ")
    print("=" * 60)
    print(f"テストケース1（認証方式）: {'✅ 正しく判定' if not result1.is_deviation else '❌ 誤判定'}")
    print(f"テストケース2（雑談）: {'✅ 正しく判定' if result2.is_deviation else '❌ 誤判定'}")
    print(f"テストケース3（チーム体制）: {'✅ 正しく判定' if not result3.is_deviation else '❌ 誤判定'}")
    print(f"テストケース4（Docker）: {'✅ 正しく判定' if result4.is_deviation else '❌ 誤判定'}")
    print(f"テストケース5（リリース計画）: {'✅ 正しく判定' if not result5.is_deviation else '❌ 誤判定'}")
    print("=" * 60)
    print("✅ AI脱線検知機能テスト完了")


if __name__ == "__main__":
    print("🚀 AI脱線検知機能テストスクリプト")
    print("=" * 60)
    
    # 設定確認
    from app.settings import settings
    print("📋 Azure OpenAI設定確認中...")
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        print("✅ Azure OpenAI設定が検出されました")
        print(f"   エンドポイント: {settings.azure_openai_endpoint}")
        print(f"   デプロイメント: {settings.azure_openai_deployment}")
        print(f"   APIバージョン: {settings.azure_openai_api_version_chat}")
    else:
        print("❌ Azure OpenAI設定が不完全です。")
        print("   .envファイルで以下の設定を確認してください:")
        print("   - AZURE_OPENAI_ENDPOINT")
        print("   - AZURE_OPENAI_API_KEY")
        print("   - AZURE_OPENAI_DEPLOYMENT")
        sys.exit(1)
    
    print("\n")
    
    # テスト実行
    try:
        asyncio.run(test_ai_deviation())
    except KeyboardInterrupt:
        print("\n\n⚠️  テストが中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ テスト実行中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
