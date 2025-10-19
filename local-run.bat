@echo off
REM ローカル開発環境 一括起動スクリプト (Windows Batch)
REM 使用方法: ダブルクリックまたは local-run.bat

echo ========================================
echo   Meeting Facilitation AI PoC
echo   ローカル開発環境 起動中...
echo ========================================
echo.

REM PowerShellスクリプトを実行
powershell -ExecutionPolicy Bypass -File "%~dp0local-run.ps1"

pause