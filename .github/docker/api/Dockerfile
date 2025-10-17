# ----------------------------------------------------- #
# ベースイメージ（Pythonスリム版）
# ----------------------------------------------------- #
FROM python:3.12-slim AS base

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------- #
# ビルダーイメージ
# ----------------------------------------------------- #
FROM base AS builder

WORKDIR /app

# Poetry のインストール
RUN pip install --no-cache-dir poetry==1.8.3

# Poetry設定（仮想環境を作らない）
RUN poetry config virtualenvs.create false

# 依存関係ファイルをコピー
COPY pyproject.toml poetry.lock ./

# srcディレクトリ構造を作成（Poetryがパッケージを認識するため）
# 実際のコードは後でコピーするが、Poetryにはディレクトリ構造が必要
RUN mkdir -p src

# 依存関係のインストール（開発依存は除く、プロジェクト自体はインストールしない）
RUN poetry install --no-dev --no-root --no-interaction --no-ansi

# ----------------------------------------------------- #
# ランナーイメージ
# ----------------------------------------------------- #
FROM base AS runner

WORKDIR /app

# ビルダーからPythonパッケージをコピー
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# アプリケーションコードをコピー
COPY src ./src
COPY alembic.ini ./
COPY migrations ./migrations
COPY .env* ./

# 環境変数の設定
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV ENVIRONMENT=production

# ポート公開
EXPOSE 8000

# デフォルトコマンド: API起動のみ
# ECS TaskDefinitionのCommandで各サービスに応じたコマンドをオーバーライドする
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]