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
    cors_origins: str = "http://localhost:3000"
    
    # ASR設定
    # asr_provider: "stub" (ダミーテキスト), "whisper_python" (Python版Whisper), "whisper_cpp" (C++版Whisper)
    asr_provider: str = "whisper_python"  # Python版Whisperを使用（安定性が高い）
    whisper_model_path: str = "./whisper-cpp/models/ggml-base.bin"
    whisper_executable_path: str = "./main.exe"  # Windowsの実行ファイル（backendディレクトリ直下）
    asr_language: str = "ja"
    asr_temperature: float = 0.0
    
    # Azure OpenAI設定（会議要約用）
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_api_version_responses: str = "2025-04-01"
    azure_openai_api_version_chat: str = "2024-12-01-preview"
    azure_openai_deployment: str = "gpt-5-mini"
    default_timezone: str = "Asia/Tokyo"


settings = Settings()
