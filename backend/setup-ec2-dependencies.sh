#!/bin/bash
# EC2依存関係セットアップスクリプト
# 初回セットアップまたは依存関係更新時に実行

set -e

echo "========================================="
echo "  EC2依存関係セットアップ"
echo "========================================="
echo ""

# FFmpegのインストール確認
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpegは既にインストール済み: $(ffmpeg -version | head -n1)"
else
    echo "📦 FFmpegをインストール中..."
    
    # EPEL リポジトリを有効化
    sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm 2>&1 || echo "EPEL already installed"
    
    # RPM Fusion リポジトリを有効化
    sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm 2>&1 || echo "RPM Fusion already installed"
    
    # FFmpegをインストール
    sudo dnf install -y ffmpeg
    
    # 確認
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpegインストール完了: $(ffmpeg -version | head -n1)"
    else
        echo "❌ FFmpegのインストールに失敗しました"
        exit 1
    fi
fi

echo ""
echo "========================================="
echo "  セットアップ完了"
echo "========================================="

