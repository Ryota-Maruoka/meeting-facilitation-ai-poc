# ----------------------------------------------------- #
# ベースイメージ(Pythonスリム版)
# ----------------------------------------------------- #
FROM python:3.12-slim AS base

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------- #
# ランナーイメージ
# ----------------------------------------------------- #
FROM base AS runner

WORKDIR /app

# 依存関係ファイルをコピーしてインストール
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY app ./app
COPY .env* ./ 2>/dev/null || true

# 環境変数の設定
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV ENVIRONMENT=production

# ポート公開
EXPOSE 8000

# デフォルトコマンド: API起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
