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

ENV NODE_ENV=production \
    PORT=3000

RUN npm run build

# ----------------------------------------------------- #
# ランナーイメージ
# ----------------------------------------------------- #
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Standaloneビルドの成果物をコピー
COPY --from=builder /app/.next/standalone ./
# 静的ファイルを別途コピー
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]