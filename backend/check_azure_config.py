"""
Azure OpenAI設定確認スクリプト

使用方法:
python check_azure_config.py
"""

import os
from app.settings import settings


def check_azure_config():
    """Azure OpenAI設定を確認"""
    
    print("🔍 Azure OpenAI設定確認")
    print("=" * 40)
    
    # 環境変数から直接確認
    print("📋 環境変数から直接確認:")
    print(f"AZURE_OPENAI_ENDPOINT: {os.getenv('AZURE_OPENAI_ENDPOINT', 'Not set')}")
    print(f"AZURE_OPENAI_API_KEY: {os.getenv('AZURE_OPENAI_API_KEY', 'Not set')[:10]}..." if os.getenv('AZURE_OPENAI_API_KEY') else "AZURE_OPENAI_API_KEY: Not set")
    print(f"AZURE_OPENAI_DEPLOYMENT: {os.getenv('AZURE_OPENAI_DEPLOYMENT', 'Not set')}")
    print(f"AZURE_OPENAI_API_VERSION_CHAT: {os.getenv('AZURE_OPENAI_API_VERSION_CHAT', 'Not set')}")
    
    print("\n📋 settings.pyから確認:")
    print(f"azure_openai_endpoint: {settings.azure_openai_endpoint}")
    print(f"azure_openai_api_key: {settings.azure_openai_api_key[:10]}..." if settings.azure_openai_api_key else "azure_openai_api_key: Not set")
    print(f"azure_openai_deployment: {settings.azure_openai_deployment}")
    print(f"azure_openai_api_version_chat: {settings.azure_openai_api_version_chat}")
    
    # 設定の完全性チェック
    print("\n✅ 設定の完全性チェック:")
    missing_configs = []
    
    if not settings.azure_openai_endpoint:
        missing_configs.append("AZURE_OPENAI_ENDPOINT")
    if not settings.azure_openai_api_key:
        missing_configs.append("AZURE_OPENAI_API_KEY")
    if not settings.azure_openai_deployment:
        missing_configs.append("AZURE_OPENAI_DEPLOYMENT")
    if not settings.azure_openai_api_version_chat:
        missing_configs.append("AZURE_OPENAI_API_VERSION_CHAT")
    
    if missing_configs:
        print(f"❌ 不足している設定: {', '.join(missing_configs)}")
        print("\n🔧 修正方法:")
        print("1. .envファイルを作成・編集")
        print("2. 以下の設定を追加:")
        print("   AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com")
        print("   AZURE_OPENAI_API_KEY=your-actual-api-key-here")
        print("   AZURE_OPENAI_DEPLOYMENT=gpt-5-mini")
        print("   AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview")
    else:
        print("✅ すべての設定が揃っています")
        
        # 構築されるURLを表示
        url = f"{settings.azure_openai_endpoint}/openai/deployments/{settings.azure_openai_deployment}/chat/completions"
        print(f"\n🔗 構築されるURL: {url}")
        print(f"📋 APIバージョン: {settings.azure_openai_api_version_chat}")
        
        print("\n💡 次のステップ:")
        print("1. Azure OpenAI Studioでデプロイメント名を確認")
        print("2. デプロイメントが存在することを確認")
        print("3. APIキーが有効であることを確認")


if __name__ == "__main__":
    check_azure_config()
