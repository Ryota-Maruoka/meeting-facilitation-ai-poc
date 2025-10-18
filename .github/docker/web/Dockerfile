# ----------------------------------------------------- #
# ベースイメージ
# ----------------------------------------------------- #
FROM node:24-bullseye-slim AS base

# ----------------------------------------------------- #
# ビルダーイメージ
# ----------------------------------------------------- #
FROM base AS builder
WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --verbose --no-audit --no-fund

# ソースコードのコピーとビルド
COPY . .

# ビルド時の環境変数（Next.jsのビルドに必要）
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_API_URL
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    BACKEND_API_URL=${BACKEND_API_URL}

RUN npm run build

# ----------------------------------------------------- #
# ランナーイメージ
# ----------------------------------------------------- #
FROM base AS runner

ARG BACKEND_API_URL
ENV NODE_ENV=production \
    PORT=3000 \
    BACKEND_API_URL=${BACKEND_API_URL}

WORKDIR /app

# Standaloneビルドの成果物をコピー
COPY --from=builder /app/.next/standalone ./
# 静的ファイルを別途コピー
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]