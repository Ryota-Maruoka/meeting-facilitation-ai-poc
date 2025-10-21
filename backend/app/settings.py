"""アプリケーション設定"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # アプリ設定
    app_name: str = "Facilitation AI PoC"
    debug: bool = False
    
    # データベース
    data_dir: str = "./data"
    summaries_dir: str = "./data/summaries"
    
    # 外部API
    openai_api_key: str = ""
    slack_webhook_url: str = ""
    
    # CORS
    cors_origins: str = "http://localhost:3000,https://bemac-meeting.fr-aicompass.com"
    
    # ASR設定
    # asr_provider: "stub" (ダミーテキスト), "whisper_python" (Python版Whisper), "azure_whisper" (Azure OpenAI Whisper)
    asr_provider: str = "azure_whisper"  # Azure OpenAI Whisper APIを使用
    asr_language: str = "ja"
    asr_temperature: float = 0.0
    
    # Azure OpenAI Whisper設定
    azure_whisper_endpoint: str = ""
    azure_whisper_api_key: str = ""
    azure_whisper_deployment: str = "whisper"
    azure_whisper_api_version: str = "2024-06-01"
    
    # Azure OpenAI設定（会議要約・脱線検知用）
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_api_version_responses: str = "2025-04-01"
    azure_openai_api_version_chat: str = "2024-12-01-preview"
    azure_openai_deployment: str = "gpt-5-mini"
    default_timezone: str = "Asia/Tokyo"


settings = Settings()
