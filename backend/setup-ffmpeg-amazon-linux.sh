#!/bin/bash
# Amazon Linux 2023用 FFmpegセットアップスクリプト
# 静的ビルド済みバイナリを使用

set -e

echo "========================================="
echo "  FFmpegセットアップ (Amazon Linux 2023)"
echo "========================================="
echo ""

# FFmpegのインストール確認
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpegは既にインストール済み: $(ffmpeg -version | head -n1)"
    exit 0
fi

echo "📦 FFmpeg静的バイナリをダウンロード中..."

# 一時ディレクトリを作成
TMP_DIR=$(mktemp -d)
cd $TMP_DIR

# FFmpeg静的ビルドをダウンロード（John Van Sickleのビルド）
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

# 展開
tar xf ffmpeg-release-amd64-static.tar.xz

# バイナリをシステムパスにコピー
FFMPEG_DIR=$(find . -name "ffmpeg-*-amd64-static" -type d | head -n1)
sudo cp $FFMPEG_DIR/ffmpeg /usr/local/bin/
sudo cp $FFMPEG_DIR/ffprobe /usr/local/bin/
sudo chmod +x /usr/local/bin/ffmpeg
sudo chmod +x /usr/local/bin/ffprobe

# クリーンアップ
cd ~
rm -rf $TMP_DIR

# 確認
if command -v ffmpeg &> /dev/null; then
    echo ""
    echo "========================================="
    echo "  ✅ FFmpegインストール完了"
    echo "========================================="
    echo ""
    ffmpeg -version | head -n1
    echo ""
else
    echo ""
    echo "========================================="
    echo "  ❌ FFmpegのインストールに失敗しました"
    echo "========================================="
    exit 1
fi

