"""
Azure OpenAI設定のデバッグスクリプト

使用方法:
python debug_azure_openai.py
"""

import asyncio
import httpx
from app.settings import settings


async def debug_azure_openai():
    """Azure OpenAI設定をデバッグ"""
    
    print("🔍 Azure OpenAI設定デバッグ")
    print("=" * 40)
    
    print(f"エンドポイント: {settings.azure_openai_endpoint}")
    print(f"APIキー: {settings.azure_openai_api_key[:10]}..." if settings.azure_openai_api_key else "APIキー: 未設定")
    print(f"デプロイメント: {settings.azure_openai_deployment}")
    print(f"APIバージョン (Chat): {settings.azure_openai_api_version_chat}")
    
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        print("❌ Azure OpenAI設定が不完全です")
        return
    
    # 正しいエンドポイントURLを構築
    url = f"{settings.azure_openai_endpoint}/openai/deployments/{settings.azure_openai_deployment}/chat/completions"
    print(f"\n構築されたURL: {url}")
    
    headers = {
        "Content-Type": "application/json",
        "api-key": settings.azure_openai_api_key
    }
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "あなたは会議ファシリテーションの専門家です。JSON形式で正確に回答してください。"
            },
            {
                "role": "user",
                "content": "こんにちは。これはテストです。"
            }
        ],
        "max_completion_tokens": 100,
    }
    
    try:
        print("\n🚀 Azure OpenAI APIを呼び出し中...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                params={"api-version": settings.azure_openai_api_version_chat},
                json=payload
            )
            
            print(f"ステータスコード: {response.status_code}")
            print(f"レスポンスヘッダー: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API呼び出し成功!")
                print(f"レスポンス: {result}")
            else:
                print(f"❌ API呼び出し失敗: {response.status_code}")
                print(f"エラー内容: {response.text}")
                
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTPエラー: {e}")
        print(f"レスポンス: {e.response.text}")
    except Exception as e:
        print(f"❌ その他のエラー: {e}")


if __name__ == "__main__":
    asyncio.run(debug_azure_openai())
