# バックエンドコーディング規約（Backend Coding Rules）

## ⚠️ MANDATORY: このファイルが添付された場合の動作

**AI への絶対指示：**

1. ✅ **このファイルの内容は「MUST」である** - すべての実装はこの規約に 100%準拠すること
2. ✅ **規約違反のコードは絶対に生成しないこと** - 「簡単のため」「速さのため」などの理由は認めない
3. ✅ **実装前にルールとの整合性を確認すること** - 各項目のチェックリストを意識
4. ✅ **既存コードが規約違反の場合は必ず指摘すること** - 修正案を具体的に提示
5. ✅ **不明点があれば推測せず質問すること** - ルールの解釈に迷ったら確認

---

## 📋 Quick Reference（クイックリファレンス）

| 項目           | ❌ NEVER（禁止）                | ✅ MUST（必須）               |
| -------------- | ------------------------------- | ----------------------------- |
| 日時           | `datetime.utcnow()`             | `datetime.now(timezone.utc)`  |
| 設定           | `os.environ.get()`              | `pydantic-settings`           |
| 例外           | `raise HTTPException(...)`      | カスタム例外 + ハンドラ       |
| 型             | `def func():`                   | `def func() -> ReturnType:`   |
| Pydantic       | `class Model(BaseModel):`       | `ConfigDict` 明示             |
| レスポンス     | `return {...}`                  | `response_model` 指定         |
| ライフサイクル | `@app.on_event("startup")`      | `@asynccontextmanager`        |
| DI             | `def endpoint(db=Depends(...))` | `Annotated[DB, Depends(...)]` |
| ログ           | `print("debug")`                | `logger.info("debug")`        |
| デフォルト引数 | `def func(lst=[]):`             | `def func(lst=None):`         |
| 例外捕捉       | `except:`                       | `except ValueError:`          |
| 型（古）       | `List[str]`, `Optional[T]`      | `list[str]`, `T \| None`      |
| Docstring      | なし                            | Google スタイル（Public API） |
| 行幅           | 79 文字（PEP 8）                | 100 文字（本プロジェクト）    |

---

## 1️⃣ バージョン方針（固定基準）

### ✅ MUST（必須バージョン）

```txt
Python: 3.11 系を標準
FastAPI: >=0.118（推奨: 0.118.2）
Pydantic: v2 系必須（推奨: 2.12+）
Uvicorn: >=0.30（推奨: 0.30.6）
```

### 🚫 NEVER（禁止事項）

- ❌ Python 3.10 以下を使用
- ❌ Pydantic v1 系の API（`orm_mode`, `Config` クラス等）
- ❌ Gunicorn を既定で採用（Uvicorn 単体で十分）

### 📦 requirements.txt 例

```txt
fastapi>=0.118.0
uvicorn[standard]>=0.30.0
pydantic>=2.12.0
pydantic-settings>=2.0.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
ruff>=0.5.0
mypy>=1.10.0
```

---

## 2️⃣ プロジェクト構成・共通ツール

### ✅ MUST（必須構成）

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry
│   ├── settings.py          # Configuration (pydantic-settings)
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── meetings.py
│   │   └── users.py
│   ├── schemas/             # Pydantic models (request/response)
│   │   ├── __init__.py
│   │   ├── meeting.py
│   │   └── user.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── meeting_service.py
│   │   └── auth_service.py
│   ├── repositories/        # Data access layer
│   │   ├── __init__.py
│   │   └── meeting_repository.py
│   ├── core/                # Core utilities
│   │   ├── __init__.py
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── logging.py       # Logging config
│   └── deps/                # Dependencies (DI)
│       ├── __init__.py
│       └── auth.py          # Auth dependencies
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_meetings.py
├── pyproject.toml           # ruff, black, mypy settings
├── log-config.yaml          # Structured logging config
├── requirements.txt
└── .env.example
```

### ✅ MUST（型注釈）

```python
# すべてのファイルの先頭に記載
from __future__ import annotations

# 公開APIはすべて型注釈必須
def create_meeting(data: MeetingCreate) -> Meeting:
    ...

# 戻り値型を省略しない
async def get_current_user() -> User:  # ✅ Good
    ...

def get_current_user():  # ❌ Bad: 戻り値型がない
    ...
```

### 🚫 NEVER（禁止事項）

- ❌ フラットな構成（すべて `app/` 直下）
- ❌ ビジネスロジックを `routers/` に記述
- ❌ 型注釈の省略（公開 API）

### 📦 pyproject.toml（必須設定）

```toml
[tool.black]
line-length = 100
target-version = ["py311"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
# PEP8相当（E/W）+ pyflakes(F), import整列(I), bugbear(B), 型(ANN), タイムゾーン(DTZ)
select = ["E", "W", "F", "I", "B", "UP", "D", "ANN", "DTZ"]
ignore = [
    "D203",      # Googleスタイルに合わせて調整
    "D213",      # multi-line-summary-second-line
    "ANN101",    # self の型注釈は不要
    "ANN102",    # cls の型注釈は不要
]

[tool.ruff.lint.isort]
known-first-party = ["app"]
combine-as-imports = true

[tool.mypy]
python_version = "3.11"
disallow_untyped_defs = true
warn_unused_ignores = true
no_implicit_optional = true
strict_equality = true
```

### 🔧 pre-commit（推奨）

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/psf/black
    rev: 24.8.0
    hooks:
      - id: black
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic>=2.0]
```

---

## 2.5️⃣ PEP 8/PEP 257 準拠とプロジェクト例外

### 📐 規約の階層

1. **原則**: [PEP 8](https://peps.python.org/pep-0008/)（Style Guide for Python Code）準拠
2. **Docstring**: [PEP 257](https://peps.python.org/pep-0257/) 準拠
3. **例外**: 本プロジェクトで明示的に上書きする項目（下記）

### ✅ MUST（プロジェクト例外・明文化）

#### 行幅

```python
# ✅ 行幅: 100 文字（black/ruff と一致）
# PEP 8 の 79 文字ではなく 100 文字を採用
def create_meeting_with_participants(
    data: MeetingCreate, participants: list[str], user: User
) -> MeetingOut:
    ...
```

#### 文字列

```python
# ✅ 基本はダブルクォート（black のデフォルト）
message = "Hello, World!"
sql_query = """
    SELECT * FROM meetings
    WHERE id = :id
"""

# 例外: 文字列内にダブルクォートが多い場合のみシングル
html = '<div class="container">Content</div>'
```

#### import 順序

```python
# ✅ 標準 → サードパーティ → ローカルの順（ruff/isort 自動整列）
# 1行1 import

# 標準ライブラリ
from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

# サードパーティ
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

# ローカル
from app.core.exceptions import NotFoundError
from app.schemas.meeting import MeetingCreate

# 相対 import はパッケージ内限定で可
from ..deps.auth import CurrentUser
from .schemas import MeetingOut
```

#### 命名規則

```python
# ✅ module_name.py          # モジュール: snake_case
# ✅ ClassName               # クラス: UpperCamelCase
# ✅ function_name()         # 関数: snake_case
# ✅ variable_name           # 変数: snake_case
# ✅ CONSTANT_NAME           # 定数: UPPER_SNAKE_CASE
# ✅ _private_method()       # プライベート: 先頭アンダースコア

class MeetingService:
    MAX_PARTICIPANTS = 100  # 定数

    def __init__(self):
        self._cache = {}    # プライベート

    def create_meeting(self, data: MeetingCreate) -> MeetingOut:
        meeting_id = str(uuid4())
        return MeetingOut(id=meeting_id, ...)
```

### 🚫 NEVER（PEP 8 厳守事項）

#### ミュータブルなデフォルト引数禁止

```python
# ❌ Bad: ミュータブルなデフォルト引数
def add_participant(meeting_id: str, participants: list[str] = []):
    participants.append(...)  # 危険！

# ✅ Good: None + 明示初期化
def add_participant(meeting_id: str, participants: list[str] | None = None):
    if participants is None:
        participants = []
    participants.append(...)
```

#### print 禁止（logging 使用）

```python
# ❌ Bad: print を使用
def create_meeting(data: MeetingCreate):
    print(f"Creating meeting: {data.title}")  # NG
    ...

# ✅ Good: logging モジュール使用
import logging

logger = logging.getLogger(__name__)

def create_meeting(data: MeetingCreate):
    logger.info("Creating meeting: %s", data.title)  # OK
    ...

# 例外: スクリプトの一時デバッグのみ OK（コミット前に削除）
```

#### 例外処理

```python
# ❌ Bad: 裸の except
try:
    result = dangerous_operation()
except:  # すべての例外を捕捉（NG）
    pass

# ❌ Bad: 広すぎる例外
try:
    result = dangerous_operation()
except Exception:  # 広すぎる
    pass

# ✅ Good: 狭い例外型を捕捉
try:
    result = dangerous_operation()
except ValueError as e:  # 具体的な例外
    logger.error("Invalid value: %s", e)
    raise ValidationError(str(e))
except KeyError as e:
    logger.error("Key not found: %s", e)
    raise NotFoundError("Resource", str(e))
```

### 📝 Docstring（PEP 257 + Google スタイル）

#### ✅ MUST（Public API は必須）

```python
def create_meeting(
    data: MeetingCreate,
    service: MeetingService,
    user: User
) -> MeetingOut:
    """会議を作成する。

    会議情報を受け取り、データベースに保存して作成された会議を返す。
    作成者は自動的に参加者リストに追加される。

    Args:
        data: 会議作成リクエストデータ
        service: 会議サービス（DI）
        user: 現在のユーザー（認証済み）

    Returns:
        作成された会議情報

    Raises:
        ValidationError: ビジネスルール違反（参加者数上限等）
        InfrastructureError: データベースエラー

    Example:
        >>> data = MeetingCreate(title="定例MTG", purpose="進捗確認")
        >>> meeting = await create_meeting(data, service, user)
        >>> print(meeting.id)
        "550e8400-e29b-41d4-a716-446655440000"
    """
    return await service.create(data, user)
```

#### Docstring スタイル

```python
# ✅ Good: Google スタイル（推奨）
def function(arg1: str, arg2: int) -> bool:
    """関数の簡潔な説明（命令形）。

    詳細な説明。複数行可。

    Args:
        arg1: 引数1の説明
        arg2: 引数2の説明

    Returns:
        戻り値の説明

    Raises:
        ValueError: エラー条件の説明
    """
    ...

# ✅ 1行 docstring（簡単な関数）
def get_meeting_id() -> str:
    """会議IDを生成する。"""
    return str(uuid4())

# ❌ Bad: docstring なし（Public API）
def create_meeting(data: MeetingCreate) -> MeetingOut:  # NG
    return ...
```

### 🔍 型注釈（Python 3.11+）

#### ✅ MUST（標準 typing 使用）

```python
# すべてのファイルの先頭に記載
from __future__ import annotations

# ✅ Good: Python 3.11 の標準型
def process_meetings(meetings: list[str]) -> dict[str, int]:
    ...

def get_user(user_id: str) -> User | None:
    ...

# ❌ Bad: 古い書き方
from typing import List, Dict, Optional

def process_meetings(meetings: List[str]) -> Dict[str, int]:  # NG
    ...

def get_user(user_id: str) -> Optional[User]:  # NG
    ...
```

### 🕐 日時（タイムゾーン aware 必須）

```python
from datetime import datetime, timezone

# ✅ Good: timezone-aware UTC
now = datetime.now(timezone.utc)

# ❌ Bad: naive datetime
now = datetime.now()  # timezone情報なし（NG）

# ❌ Bad: deprecated
now = datetime.utcnow()  # Python 3.12+ で非推奨
```

---

## 3️⃣ アプリ起動・ライフサイクル

### ✅ MUST（lifespan 使用）

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時処理: DB接続プール、キャッシュ初期化等
    print("Starting up...")
    # DB pool, Redis client, etc.
    yield
    # 終了時処理: graceful shutdown
    print("Shutting down...")
    # Close connections

app = FastAPI(lifespan=lifespan, title="Facilitation AI API")
```

### 🚫 NEVER（非推奨 API）

```python
# ❌ Bad: on_event は非推奨
@app.on_event("startup")
async def startup():
    ...

@app.on_event("shutdown")
async def shutdown():
    ...
```

### ✅ MUST（テストでの使用）

```python
# tests/test_meetings.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_meeting():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/meetings", json={...})
        assert response.status_code == 201
```

---

## 4️⃣ 依存性注入（DI）

### ✅ MUST（Annotated + Depends）

```python
from typing import Annotated
from fastapi import APIRouter, Depends
from app.deps.auth import get_current_user
from app.schemas.user import User

router = APIRouter()

# 型エイリアスを定義
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get("/me")
async def read_me(user: CurrentUser):
    return user

# クラス依存も Annotated で
from app.services.meeting_service import MeetingService

def get_meeting_service() -> MeetingService:
    return MeetingService()

MeetingSvc = Annotated[MeetingService, Depends(get_meeting_service)]

@router.post("/meetings")
async def create_meeting(
    data: MeetingCreate,
    service: MeetingSvc,
    user: CurrentUser
):
    return await service.create(data, user)
```

### 🚫 NEVER（古い書き方）

```python
# ❌ Bad: Annotated を使わない
@router.get("/me")
async def read_me(user: User = Depends(get_current_user)):
    ...
```

### ⚠️ 注意事項

- グローバル DI は慎重に（挙動差異の既知事象あり）
- 依存関係は明示的に型エイリアスで定義

---

## 5️⃣ データモデル／バリデーション（Pydantic v2）

### ✅ MUST（ConfigDict 必須）

```python
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class MeetingBase(BaseModel):
    """会議の基本情報"""
    model_config = ConfigDict(
        from_attributes=True,  # ORM連携（旧 orm_mode）
        extra="forbid",        # 未定義フィールドを拒否
        str_strip_whitespace=True,  # 文字列の前後空白削除
    )

    title: str = Field(..., min_length=1, max_length=200)
    purpose: str
    deliverable_template: str

class MeetingCreate(MeetingBase):
    """会議作成リクエスト"""
    participants: list[str] = []

class MeetingOut(MeetingBase):
    """会議レスポンス"""
    id: str
    created_at: datetime = Field(
        serialization_alias="createdAt",  # JSON出力時は createdAt
        description="UTC ISO-8601 format"
    )

# 使用例
meeting_data = {...}
meeting = MeetingOut.model_validate(meeting_data)
```

### ✅ MUST（日時は timezone-aware）

```python
from datetime import datetime, timezone

# ✅ Good: timezone-aware
now_utc = datetime.now(timezone.utc)
meeting.created_at = now_utc

# ❌ Bad: deprecated (Python 3.12+)
now = datetime.utcnow()

# ❌ Bad: naive datetime
now = datetime.now()  # timezone 情報なし
```

### ✅ MUST（スキーマ例の追加）

```python
class MeetingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "週次定例MTG",
                    "purpose": "進捗確認と課題共有",
                    "deliverable_template": "決定事項・アクション",
                    "participants": ["alice@example.com", "bob@example.com"],
                }
            ]
        }
    )
    title: str
    purpose: str
    # ...
```

### 🚫 NEVER（Pydantic v1 API）

```python
# ❌ Bad: v1 の書き方
class User(BaseModel):
    class Config:  # v2 では ConfigDict
        orm_mode = True  # v2 では from_attributes
```

---

## 6️⃣ 設定管理（12-Factor）

### ✅ MUST（pydantic-settings）

```python
# app/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # アプリ設定
    app_name: str = "Facilitation AI PoC"
    debug: bool = False

    # データベース
    database_url: str = "sqlite:///./data/app.db"

    # 外部API
    openai_api_key: str = ""
    slack_webhook_url: str = ""

    # ディレクトリ
    data_dir: str = "./data"

    # CORS
    cors_origins: str = "http://localhost:3000"  # カンマ区切り

settings = Settings()
```

### ✅ MUST（DI で供給）

```python
# app/deps/config.py
from typing import Annotated
from fastapi import Depends
from app.settings import Settings, settings

def get_settings() -> Settings:
    return settings

SettingsDep = Annotated[Settings, Depends(get_settings)]

# 使用例
@router.get("/config")
async def get_config(settings: SettingsDep):
    return {"app_name": settings.app_name}
```

### ✅ MUST（.env ファイル管理）

```bash
# .env.example（リポジトリにコミット）
APP_NAME=Facilitation AI PoC
DEBUG=true
DATABASE_URL=sqlite:///./data/app.db
DATA_DIR=./data
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# .env（ローカル開発用、.gitignore に追加）
APP_NAME=Facilitation AI PoC
DEBUG=true
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 🚫 NEVER（禁止事項）

```python
# ❌ Bad: os.environ を直接使用
import os
data_dir = os.environ.get("DATA_DIR", "./data")

# ❌ Bad: 秘密情報をハードコード
api_key = "sk-1234567890abcdef"
```

---

## 7️⃣ API 設計・レスポンス

### ✅ MUST（response_model 必須）

```python
from fastapi import APIRouter
from app.schemas.meeting import MeetingOut, MeetingCreate

router = APIRouter(prefix="/meetings", tags=["meetings"])

# ✅ Good: response_model 指定
@router.post("/", response_model=MeetingOut, status_code=201)
async def create_meeting(data: MeetingCreate) -> MeetingOut:
    meeting = await service.create(data)
    return meeting

# ❌ Bad: 辞書を直接返す
@router.post("/")
async def create_meeting(data: MeetingCreate):
    return {"id": "123", "title": data.title}  # 型安全でない
```

### ✅ MUST（RESTful 設計）

```python
# ✅ Good: 資源指向
GET    /meetings              # 一覧取得
POST   /meetings              # 作成
GET    /meetings/{id}         # 詳細取得
PUT    /meetings/{id}         # 更新
DELETE /meetings/{id}         # 削除
POST   /meetings/{id}/actions # サブリソース作成

# ❌ Bad: 動詞を含む
POST   /create_meeting
GET    /get_meeting_by_id
```

### ✅ MUST（カスタム例外階層）

```python
# app/core/exceptions.py
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
```

### ✅ MUST（例外ハンドラ）

```python
# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError

app = FastAPI()

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url),
        }
    )

# 使用例
from app.core.exceptions import NotFoundError

@router.get("/{meeting_id}", response_model=MeetingOut)
async def get_meeting(meeting_id: str):
    meeting = await service.get(meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)
    return meeting
```

### 🚫 NEVER（HTTPException 直接使用）

```python
# ❌ Bad: HTTPException を直接使用
from fastapi import HTTPException

@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    if not meeting:
        raise HTTPException(404, "Meeting not found")  # 統一感がない
```

---

## 8️⃣ 日時・タイムゾーン規約

### ✅ MUST（UTC timezone-aware 必須）

```python
from datetime import datetime, timezone

# ✅ Good: 常に UTC の timezone-aware
now_utc = datetime.now(timezone.utc)

# ISO-8601 形式でシリアライズ（Z付き）
iso_string = now_utc.isoformat()  # "2025-10-10T12:34:56+00:00"
# または
iso_string = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
```

### 🚫 NEVER（naive datetime 禁止）

```python
# ❌ Bad: deprecated (Python 3.12+)
now = datetime.utcnow()

# ❌ Bad: naive datetime（timezone情報なし）
now = datetime.now()

# ❌ Bad: ローカルタイムゾーン
now = datetime.now(timezone(timedelta(hours=9)))  # JST
```

### 📝 理由

- **クライアント混乱を避ける**: すべて UTC に統一
- **実装/運用の論点**: naive datetime は比較時にエラーが出やすい
- **国際対応**: タイムゾーンはクライアント側で変換

---

## 9️⃣ ロギング／監視

### ✅ MUST（構造化ログ: JSON）

```yaml
# log-config.yaml
version: 1
disable_existing_loggers: false

formatters:
  json:
    class: pythonjsonlogger.jsonlogger.JsonFormatter
    format: "%(asctime)s %(levelname)s %(name)s %(message)s"

handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: json
    stream: ext://sys.stdout

loggers:
  uvicorn:
    level: INFO
    handlers: [console]
    propagate: false
  uvicorn.access:
    level: INFO
    handlers: [console]
    propagate: false
  app:
    level: INFO
    handlers: [console]
    propagate: false

root:
  level: INFO
  handlers: [console]
```

### ✅ MUST（相関 ID: X-Request-ID）

```python
# app/middleware/request_id.py
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

# app/main.py
from app.middleware.request_id import RequestIDMiddleware

app.add_middleware(RequestIDMiddleware)
```

### ✅ MUST（起動コマンド）

```bash
# 構造化ログを有効化
uvicorn app.main:app --log-config log-config.yaml
```

---

## 🔟 サーバ／デプロイ指針

### ✅ MUST（開発環境）

```bash
# --reload はローカル限定
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### ✅ MUST（本番環境: Uvicorn 単体）

```bash
# マルチワーカー + graceful shutdown
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --limit-max-requests 10000 \
  --timeout-keep-alive 5 \
  --graceful-timeout 30
```

### ✅ MUST（Dockerfile 例）

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 🚫 NEVER（非推奨）

```bash
# ❌ Bad: Gunicorn を既定で使わない（Uvicorn単体で十分）
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# ❌ Bad: 本番で --reload
uvicorn app.main:app --reload  # ホットリロード前提の副作用コード禁止
```

---

## 1️⃣1️⃣ 例外・エラーハンドリング

### ✅ MUST（HTTP ステータスコードの使い分け）

| コード | 用途                 | 例                    |
| ------ | -------------------- | --------------------- |
| 200    | 成功（取得・更新）   | GET /meetings/{id}    |
| 201    | 作成成功             | POST /meetings        |
| 204    | 成功（ボディなし）   | DELETE /meetings/{id} |
| 400    | リクエスト不正       | ビジネスルール違反    |
| 401    | 認証エラー           | トークン無効          |
| 403    | 認可エラー           | 権限不足              |
| 404    | リソース不在         | 存在しない ID         |
| 409    | リソース競合         | 重複作成              |
| 422    | バリデーションエラー | Pydantic 自動         |
| 500    | サーバーエラー       | 予期しない例外        |

### ✅ MUST（内部例外を隠蔽）

```python
# ✅ Good: 内部詳細を露出しない
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # 内部エラーはログに記録
    logger.error(f"Unexpected error: {exc}", exc_info=True)

    # クライアントには一般的なメッセージ
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
        }
    )

# ❌ Bad: スタックトレースを露出
raise Exception(f"Database connection failed: {db_error}")  # 露出NG
```

---

## 1️⃣2️⃣ セキュリティ

### ✅ MUST（認証: Bearer/JWT）

```python
# app/deps/auth.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> User:
    token = credentials.credentials
    # JWTを検証（例: PyJWT使用）
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED)
        return await get_user_by_id(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

CurrentUser = Annotated[User, Depends(get_current_user)]
```

### ✅ MUST（認可: スコープ）

```python
from fastapi import Security

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Security(security, scopes=["admin"])
):
    # スコープチェック
    ...

@router.delete("/{meeting_id}", dependencies=[Depends(require_admin)])
async def delete_meeting(meeting_id: str):
    ...
```

### 🚫 NEVER（秘密情報の露出）

```python
# ❌ Bad: コードにハードコード
SECRET_KEY = "my-secret-key-12345"

# ❌ Bad: ログに出力
logger.info(f"API Key: {settings.openai_api_key}")

# ✅ Good: 環境変数 + pydantic-settings
# settings.py で定義、.env で管理
```

---

## 1️⃣3️⃣ テスト

### ✅ MUST（pytest + httpx.AsyncClient）

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# tests/test_meetings.py
import pytest

@pytest.mark.asyncio
async def test_create_meeting(client: AsyncClient):
    response = await client.post("/meetings", json={
        "title": "Test Meeting",
        "purpose": "Testing",
        "deliverable_template": "Summary",
        "participants": [],
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Meeting"
    assert "id" in data
    assert "createdAt" in data  # serialization_alias

@pytest.mark.asyncio
async def test_get_meeting_not_found(client: AsyncClient):
    response = await client.get("/meetings/nonexistent-id")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
```

### ✅ MUST（lifespan のテスト）

```python
# lifespan を含むテスト
@pytest.mark.asyncio
async def test_with_lifespan():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # lifespan の startup が実行される
        response = await client.get("/health")
        assert response.status_code == 200
    # lifespan の shutdown が実行される
```

---

## 📋 実装チェックリスト

コード生成後、以下を必ず確認すること：

### 基本

- [ ] `from __future__ import annotations` を記載
- [ ] すべての関数に型注釈（引数・戻り値）
- [ ] `response_model` を指定
- [ ] `ConfigDict` を明示

### PEP 8/PEP 257

- [ ] 行幅 100 文字以内
- [ ] ダブルクォート使用（文字列）
- [ ] import 順序: 標準 → サードパーティ → ローカル
- [ ] 命名: `snake_case`, `UpperCamelCase`, `CONSTANT_CASE`
- [ ] ミュータブルなデフォルト引数なし（`None` + 初期化）
- [ ] `print` 禁止、`logging` 使用
- [ ] 具体的な例外型を捕捉（裸 `except` 禁止）
- [ ] Public API に Docstring（Google スタイル）
- [ ] Python 3.11+ の型表記（`list[str]`, `T | None`）

### 日時・設定

- [ ] `datetime.now(timezone.utc)` を使用（`utcnow()` 禁止）
- [ ] `pydantic-settings` で設定管理（`os.environ` 禁止）
- [ ] `.env.example` に設定項目を記載

### 依存性注入・例外

- [ ] `Annotated[Type, Depends(...)]` を使用
- [ ] カスタム例外を定義（`HTTPException` 直接使用禁止）
- [ ] 例外ハンドラで統一整形

### ライフサイクル・ロギング

- [ ] `@asynccontextmanager` で lifespan 実装
- [ ] 構造化ログ設定（`log-config.yaml`）
- [ ] 相関 ID ミドルウェア
- [ ] モジュール先頭で `logger = logging.getLogger(__name__)`

### セキュリティ・テスト

- [ ] 秘密情報を環境変数で管理
- [ ] Bearer/JWT で認証
- [ ] pytest + AsyncClient でテスト記述

### ツール設定

- [ ] `pyproject.toml` に ruff/black/mypy 設定
- [ ] `.pre-commit-config.yaml` 設定（推奨）
- [ ] コミット前に `ruff check` と `mypy` 実行

---

## 📖 最小構成サンプル（完全版）

```python
# app/routers/meetings.py
from __future__ import annotations
from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
from app.core.exceptions import NotFoundError
from app.deps.auth import CurrentUser

router = APIRouter(prefix="/meetings", tags=["meetings"])

# Schema
class MeetingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(..., min_length=1)
    purpose: str

class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
    id: str
    title: str
    created_at: datetime = Field(serialization_alias="createdAt")

# Service（DI）
class MeetingService:
    async def create(self, data: MeetingCreate, user: User) -> MeetingOut:
        meeting_id = str(uuid4())
        now = datetime.now(timezone.utc)
        # DB保存処理...
        return MeetingOut(id=meeting_id, title=data.title, created_at=now)

    async def get(self, meeting_id: str) -> MeetingOut | None:
        # DB取得処理...
        return None

def get_meeting_service() -> MeetingService:
    return MeetingService()

MeetingSvc = Annotated[MeetingService, Depends(get_meeting_service)]

# Endpoints
@router.post("/", response_model=MeetingOut, status_code=201)
async def create_meeting(
    data: MeetingCreate,
    service: MeetingSvc,
    user: CurrentUser
) -> MeetingOut:
    """会議を作成"""
    return await service.create(data, user)

@router.get("/{meeting_id}", response_model=MeetingOut)
async def get_meeting(
    meeting_id: str,
    service: MeetingSvc
) -> MeetingOut:
    """会議詳細を取得"""
    meeting = await service.get(meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)
    return meeting
```

---

## 🎯 まとめ

このファイルが添付された場合、AI は以下を厳守すること：

1. ✅ **すべての実装はこの規約に 100%準拠**

   - PEP 8/PEP 257 を基本とし、プロジェクト例外（行幅 100 等）を適用
   - FastAPI/Pydantic v2 のベストプラクティスに従う

2. ✅ **チェックリストを意識して実装**

   - 型注釈、Docstring、例外処理、ログ、日時処理を確認
   - ruff/black/mypy による自動チェックを前提

3. ✅ **規約違反を発見したら必ず指摘**

   - 既存コードの問題点も指摘し、修正案を提示
   - `datetime.utcnow()`, `print()`, 裸 `except` 等の典型的違反を見逃さない

4. ✅ **不明点は推測せず質問**

   - ルール解釈に迷ったら確認
   - ビジネス要件が不明確な場合も質問

5. ✅ **コード例を参考に実装**
   - Quick Reference と各セクションのサンプルコードを活用
   - 最小構成サンプル（完全版）を参考に一貫性を保つ

---

**規約を守ることで、以下を実現できます：**

- 🛡️ **保守性**: 一貫したコードスタイルで可読性向上
- 🔒 **安全性**: 型安全、例外処理、セキュリティの徹底
- ⚡ **効率性**: 自動化ツール（ruff/black/mypy）による高速レビュー
- 🌍 **拡張性**: FastAPI/Pydantic v2 のモダンな機能を最大活用
