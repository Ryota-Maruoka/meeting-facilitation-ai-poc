# -----------------------------------------------------
# ベースイメージ（ECR Public / python:3.12-slim）
# -----------------------------------------------------
FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
    
# 必要パッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libpq-dev ffmpeg curl \
     && rm -rf /var/lib/apt/lists/*
    
WORKDIR /app
    
# 依存関係を先にインストール（キャッシュ有効化）
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
    
# アプリ本体
COPY backend/app ./app
    
EXPOSE 8000
    
# 起動コマンド
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]