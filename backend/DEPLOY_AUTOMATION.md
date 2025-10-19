# EC2自動デプロイ設定ガイド

EC2へのバックエンドデプロイを自動化する方法

---

## 📋 目次

1. [デプロイスクリプト（手動）](#デプロイスクリプト手動)
2. [GitHub Actions（自動）](#github-actions自動)
3. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 デプロイスクリプト（手動）

### 使い方

**PowerShell**で以下を実行：

```powershell
cd backend
.\deploy-to-ec2.ps1
```

### 実行内容

1. バックエンドファイルをEC2に転送
2. 依存関係を更新
3. サービスを再起動
4. 動作確認

### 実行時間

約30秒〜1分

---

## 🤖 GitHub Actions（自動）

### 初回セットアップ

#### ステップ1: GitHub Secretsの設定

1. **GitHubリポジトリ**を開く
   ```
   https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc
   ```

2. **Settings** → **Secrets and variables** → **Actions** をクリック

3. **New repository secret** をクリックして、以下を登録：

#### 必要なSecrets

| Name | Value | 説明 |
|------|-------|------|
| `EC2_SSH_KEY` | SSH秘密鍵の内容 | `meeting-api-key.pem` の内容をコピー |
| `EC2_IP` | `54.250.241.155` | EC2のElastic IP |
| `EC2_USER` | `ec2-user` | EC2のユーザー名 |

#### SSH秘密鍵の取得方法

**PowerShell**で実行：

```powershell
Get-Content C:\Users\r_endo\Downloads\meeting-api-key.pem | Set-Clipboard
```

→ クリップボードにコピーされるので、GitHub Secretsに貼り付け

---

### 動作

#### 自動デプロイのトリガー

以下の場合に自動的にEC2にデプロイされます：

1. **mainブランチへのpush**
2. **backend/配下のファイル変更**

#### 手動デプロイ

GitHubの **Actions** タブから手動実行も可能：

1. **Actions** タブを開く
2. **Deploy Backend to EC2** を選択
3. **Run workflow** をクリック

---

### デプロイフロー

```
Git push
  ↓
GitHub Actions 起動
  ↓
1. コードをチェックアウト
  ↓
2. SSH鍵を設定
  ↓
3. バックエンドファイルをEC2に転送
  ↓
4. サービスを再起動
  ↓
5. 動作確認（/health）
  ↓
✅ デプロイ完了
```

---

## 📊 デプロイ履歴の確認

### GitHub Actions

```
https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc/actions
```

- ✅ 緑色のチェックマーク：デプロイ成功
- ❌ 赤色のバツマーク：デプロイ失敗

失敗した場合は、ログを確認して原因を特定してください。

---

## 🔧 トラブルシューティング

### デプロイスクリプトが失敗する

#### 原因1: SSH鍵が見つからない

**エラー**:
```
Warning: Identity file meeting-api-key.pem not accessible
```

**解決**:
```powershell
# SSH鍵のパスを確認
Get-ChildItem C:\Users\r_endo\Downloads\meeting-api-key.pem

# スクリプト内のパスを修正
# deploy-to-ec2.ps1 の $SSH_KEY 変数を更新
```

#### 原因2: EC2サービスが起動しない

**エラー**:
```
❌ サービス再起動に失敗しました
```

**解決**:
```powershell
# エラーログを確認
ssh -i C:\Users\r_endo\Downloads\meeting-api-key.pem ec2-user@54.250.241.155 "sudo journalctl -u meeting-api -n 50"

# 依存関係の問題の場合
ssh -i C:\Users\r_endo\Downloads\meeting-api-key.pem ec2-user@54.250.241.155 "cd ~/backend && python3.11 -m pip install --user -r requirements.txt"
```

---

### GitHub Actionsが失敗する

#### 原因1: Secretsが設定されていない

**エラー**:
```
Error: Process completed with exit code 255
```

**解決**:
- GitHub Secretsを確認
- `EC2_SSH_KEY`, `EC2_IP`, `EC2_USER` がすべて設定されているか確認

#### 原因2: SSH接続エラー

**エラー**:
```
Permission denied (publickey)
```

**解決**:
- `EC2_SSH_KEY` の内容が正しいか確認
- 改行コードが含まれているか確認（BEGIN/ENDを含む全体をコピー）

---

## 📝 ベストプラクティス

### デプロイ前の確認事項

```
✅ ローカルでテスト済み
✅ Linterエラーがない
✅ 必要なファイルがすべて含まれている
✅ requirements.txt が最新
```

### デプロイ後の確認事項

```
✅ /health エンドポイントが200を返す
✅ サービスが running 状態
✅ ログにエラーがない
✅ 本番環境で動作確認
```

### 推奨デプロイフロー

```
1. ローカルで開発・テスト
2. Git commit & push
3. GitHub Actionsで自動デプロイ
4. 本番環境で動作確認
```

---

## 🎯 緊急時の手動デプロイ

GitHub Actionsが動作しない場合の手動デプロイ手順：

```powershell
# 1. バックエンドディレクトリに移動
cd C:\Users\r_endo\meeting-facilitation-ai-poc\backend

# 2. デプロイスクリプト実行
.\deploy-to-ec2.ps1

# 3. 動作確認
curl http://54.250.241.155:8000/health
```

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. EC2インスタンスが起動しているか
2. Elastic IPが関連付けられているか
3. セキュリティグループでポート8000が開いているか
4. SSH鍵が正しいか

---

## 🔄 更新履歴

- **2025-10-19**: 初版作成
  - PowerShellデプロイスクリプト追加
  - GitHub Actions自動デプロイ追加

