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
    
    # 外部API
    openai_api_key: str = ""
    slack_webhook_url: str = ""
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # ASR設定
    asr_provider: str = "whisper_cpp"
    whisper_model_path: str = "./whisper-cpp/models/ggml-base.bin"
    whisper_executable_path: str = "./whisper-cpp/main"
    asr_language: str = "ja"
    asr_temperature: float = 0.0


settings = Settings()
