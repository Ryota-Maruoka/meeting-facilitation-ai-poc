"""カスタム例外クラス定義"""


class AppError(Exception):
    """アプリケーション例外の基底クラス"""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class DomainError(AppError):
    """ドメインロジックエラー"""
    pass


class NotFoundError(DomainError):
    """リソースが見つからない"""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            f"{resource} not found: {identifier}",
            status_code=404
        )


class ValidationError(DomainError):
    """ビジネスルール違反"""
    
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class InfrastructureError(AppError):
    """インフラ層エラー（DB、外部API等）"""
    pass
