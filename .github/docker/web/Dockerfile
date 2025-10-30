# ----------------------------------------------------- #
# ベースイメージ
# ----------------------------------------------------- #
FROM --platform=linux/amd64 node:24-bullseye-slim AS base

# ----------------------------------------------------- #
# ビルダーイメージ
# ----------------------------------------------------- #
FROM base AS builder
WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --verbose --no-audit --no-fund

# ソースコードのコピー
COPY . .

# ----------------------------------------------------- #
# ビルド時の環境変数（Next.js のビルドに必要）
# ----------------------------------------------------- #
# - NEXT_PUBLIC_API_URL: クライアント直叩きのAPIベースURL（相対 /backend-api 推奨）
# - BACKEND_API_URL: Next.js のリライト先URL（http://localhost:8000 等の絶対URLを指定）
ARG NEXT_PUBLIC_API_URL="/backend-api"
ARG BACKEND_API_URL="http://localhost:8000"
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    BACKEND_API_URL=${BACKEND_API_URL}

# Standaloneビルド（Next.js 13+）
RUN npm run build

# ----------------------------------------------------- #
# ランナーイメージ
# ----------------------------------------------------- #
FROM base AS runner
WORKDIR /app

# 実行時に利用される環境変数
ARG BACKEND_API_URL
ENV NODE_ENV=production \
    PORT=3000 \
    BACKEND_API_URL=${BACKEND_API_URL}

# Standaloneビルド成果物のコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Next.js standalone server 起動
CMD ["node", "server.js"]