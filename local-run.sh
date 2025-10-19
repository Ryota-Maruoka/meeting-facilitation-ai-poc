#!/bin/bash
# ローカル開発環境 一括起動スクリプト (Bash)
# 使用方法: ./local-run.sh

echo "========================================"
echo "  Meeting Facilitation AI PoC"
echo "  ローカル開発環境 起動中..."
echo "========================================"
echo ""

# プロジェクトルートディレクトリを取得
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"

# バックエンドの仮想環境が存在するか確認
if [ ! -f "$BACKEND_PATH/.venv/Scripts/activate" ] && [ ! -f "$BACKEND_PATH/.venv/bin/activate" ]; then
    echo "エラー: バックエンドの仮想環境が見つかりません"
    echo "以下のコマンドで仮想環境を作成してください:"
    echo "  cd backend"
    echo "  python -m venv .venv"
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "  .venv/Scripts/activate"
    else
        echo "  source .venv/bin/activate"
    fi
    echo "  pip install -r requirements.txt"
    exit 1
fi

# フロントエンドのnode_modulesが存在するか確認
if [ ! -d "$FRONTEND_PATH/node_modules" ]; then
    echo "エラー: フロントエンドの依存パッケージがインストールされていません"
    echo "以下のコマンドで依存パッケージをインストールしてください:"
    echo "  cd frontend"
    echo "  npm install"
    exit 1
fi

echo "[1/2] バックエンドを起動中..."
echo "  ポート: 8000"
echo "  URL: http://localhost:8000"
echo ""

# バックエンドを起動（バックグラウンドで）
cd "$BACKEND_PATH"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    .venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
else
    # Linux/Mac
    source .venv/bin/activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000 &
fi
BACKEND_PID=$!

# バックエンドの起動を少し待つ
sleep 3

echo "[2/2] フロントエンドを起動中..."
echo "  ポート: 3000"
echo "  URL: http://localhost:3000"
echo ""

# フロントエンドを起動（バックグラウンドで）
cd "$FRONTEND_PATH"
npm run dev &
FRONTEND_PID=$!

sleep 2

echo "========================================"
echo "  起動完了！"
echo "========================================"
echo ""
echo "アクセス先:"
echo "  フロントエンド: http://localhost:3000"
echo "  バックエンドAPI: http://localhost:8000"
echo "  APIドキュメント: http://localhost:8000/docs"
echo ""
echo "プロセスID:"
echo "  バックエンド PID: $BACKEND_PID"
echo "  フロントエンド PID: $FRONTEND_PID"
echo ""
echo "終了方法:"
echo "  Ctrl+C を押すか、以下のコマンドを実行してください"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Ctrl+Cで両方のプロセスを終了
trap "echo ''; echo '終了中...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# フォアグラウンドで待機
wait