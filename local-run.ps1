# ローカル開発環境 一括起動スクリプト (PowerShell)
# 使用方法: .\local-run.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Meeting Facilitation AI PoC" -ForegroundColor Cyan
Write-Host "  ローカル開発環境 起動中..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# プロジェクトルートディレクトリを取得
$projectRoot = $PSScriptRoot

# バックエンドの仮想環境パス
$backendPath = Join-Path $projectRoot "backend"
$venvPath = Join-Path $backendPath ".venv\Scripts\Activate.ps1"

# フロントエンドのパス
$frontendPath = Join-Path $projectRoot "frontend"

# バックエンドの仮想環境が存在するか確認
if (-not (Test-Path $venvPath)) {
    Write-Host "エラー: バックエンドの仮想環境が見つかりません" -ForegroundColor Red
    Write-Host "以下のコマンドで仮想環境を作成してください:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# フロントエンドのnode_modulesが存在するか確認
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "エラー: フロントエンドの依存パッケージがインストールされていません" -ForegroundColor Red
    Write-Host "以下のコマンドで依存パッケージをインストールしてください:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/2] バックエンドを起動中..." -ForegroundColor Green
Write-Host "  ポート: 8000" -ForegroundColor Gray
Write-Host "  URL: http://localhost:8000" -ForegroundColor Gray
Write-Host ""

# バックエンドを起動（別ウィンドウで）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$venvPath'; uvicorn app.main:app --host 0.0.0.0 --port 8000"

# バックエンドの起動を少し待つ
Start-Sleep -Seconds 3

Write-Host "[2/2] フロントエンドを起動中..." -ForegroundColor Green
Write-Host "  ポート: 3000" -ForegroundColor Gray
Write-Host "  URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# フロントエンドを起動（別ウィンドウで）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  起動完了！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "アクセス先:" -ForegroundColor White
Write-Host "  フロントエンド: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  バックエンドAPI: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  APIドキュメント: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "終了方法:" -ForegroundColor White
Write-Host "  各ウィンドウで Ctrl+C を押してください" -ForegroundColor Yellow
Write-Host ""