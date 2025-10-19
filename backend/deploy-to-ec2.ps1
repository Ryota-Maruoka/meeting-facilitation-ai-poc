# EC2自動デプロイスクリプト（PowerShell）
# 使い方: .\deploy-to-ec2.ps1

# 設定
$EC2_IP = "54.250.241.155"
$EC2_USER = "ec2-user"
$REMOTE_DIR = "~/backend"

# SSH鍵のパス（プロジェクトルートの.sshディレクトリ）
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$SSH_KEY = Join-Path $PROJECT_ROOT ".ssh\meeting-api-key.pem"

# SSH鍵の存在確認
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ SSH鍵が見つかりません: $SSH_KEY" -ForegroundColor Red
    Write-Host ""
    Write-Host "セットアップ手順:" -ForegroundColor Yellow
    Write-Host "  1. プロジェクトルートに .ssh ディレクトリを作成" -ForegroundColor White
    Write-Host "  2. meeting-api-key.pem を .ssh/ に配置" -ForegroundColor White
    Write-Host ""
    Write-Host "または、Downloadsから自動コピー:" -ForegroundColor Yellow
    Write-Host "  Copy-Item ~\Downloads\meeting-api-key.pem .\.ssh\" -ForegroundColor White
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EC2バックエンド自動デプロイ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ステップ1: バックエンドディレクトリ全体を転送
Write-Host "[1/3] バックエンドファイルを転送中..." -ForegroundColor Yellow
$scpResult = scp -i $SSH_KEY -r app/ run.py requirements.txt "${EC2_USER}@${EC2_IP}:${REMOTE_DIR}/" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ファイル転送に失敗しました" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ファイル転送完了" -ForegroundColor Green
Write-Host ""

# ステップ2: 依存関係の更新（必要な場合）
Write-Host "[2/3] 依存関係を確認中..." -ForegroundColor Yellow
$pipResult = ssh -i $SSH_KEY "${EC2_USER}@${EC2_IP}" "cd ${REMOTE_DIR}; python3.11 -m pip install --user -r requirements.txt --quiet" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  依存関係の更新に失敗しましたが、続行します" -ForegroundColor Yellow
}
else {
    Write-Host "✅ 依存関係確認完了" -ForegroundColor Green
}
Write-Host ""

# ステップ3: サービス再起動
Write-Host "[3/3] サービスを再起動中..." -ForegroundColor Yellow
$restartResult = ssh -i $SSH_KEY "${EC2_USER}@${EC2_IP}" "sudo systemctl restart meeting-api" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ サービス再起動に失敗しました" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 3

# ステータス確認
Write-Host ""
Write-Host "サービス状態:" -ForegroundColor Cyan
$statusResult = ssh -i $SSH_KEY "${EC2_USER}@${EC2_IP}" "sudo systemctl status meeting-api --no-pager -l" | Select-String -Pattern "Active:"
Write-Host $statusResult

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  デプロイ完了！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "動作確認:" -ForegroundColor Yellow
Write-Host "  curl http://${EC2_IP}:8000/health" -ForegroundColor White
Write-Host ""
