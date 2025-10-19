# GitHub Secrets設定ガイド

GitHub Actionsでの自動デプロイを有効化するための設定手順

---

## 📋 必要な情報

以下の情報をGitHub Secretsに登録します：

| Secret名 | 値 |
|---------|-----|
| `EC2_SSH_KEY` | SSH秘密鍵の内容（meeting-api-key.pem） |
| `EC2_IP` | `54.250.241.155` |
| `EC2_USER` | `ec2-user` |

---

## 🔧 設定手順

### ステップ1: GitHubリポジトリを開く

```
https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc
```

---

### ステップ2: Settingsに移動

1. リポジトリページの上部で **Settings** タブをクリック
2. 左側のメニューで **Secrets and variables** を展開
3. **Actions** をクリック

---

### ステップ3: Secretを登録

#### 3-1: EC2_SSH_KEY の登録

1. **New repository secret** をクリック

2. **Name** に入力:
   ```
   EC2_SSH_KEY
   ```

3. **Secret** に入力:
   
   **PowerShell**で以下を実行してクリップボードにコピー:
   ```powershell
   Get-Content C:\Users\r_endo\Downloads\meeting-api-key.pem | Set-Clipboard
   ```
   
   または、メモ帳で `meeting-api-key.pem` を開いてコピー:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   （秘密鍵の内容）
   -----END RSA PRIVATE KEY-----
   ```

4. **Add secret** をクリック

---

#### 3-2: EC2_IP の登録

1. **New repository secret** をクリック

2. **Name** に入力:
   ```
   EC2_IP
   ```

3. **Secret** に入力:
   ```
   54.250.241.155
   ```

4. **Add secret** をクリック

---

#### 3-3: EC2_USER の登録

1. **New repository secret** をクリック

2. **Name** に入力:
   ```
   EC2_USER
   ```

3. **Secret** に入力:
   ```
   ec2-user
   ```

4. **Add secret** をクリック

---

## ✅ 設定確認

### Secretsが登録されているか確認

**Settings** → **Secrets and variables** → **Actions**

以下の3つが表示されていればOK：

```
✅ EC2_SSH_KEY
✅ EC2_IP
✅ EC2_USER
```

---

## 🧪 動作テスト

### 手動実行でテスト

1. **Actions** タブを開く
2. **Deploy Backend to EC2** を選択
3. **Run workflow** をクリック
4. **Run workflow** を再度クリック

### 結果確認

- ✅ **緑色のチェックマーク**: デプロイ成功
- ❌ **赤色のバツマーク**: デプロイ失敗（ログを確認）

---

## 🔐 セキュリティ上の注意

### Secretsの取り扱い

```
⚠️  SSH秘密鍵は絶対に公開しない
⚠️  GitHub Secretsは暗号化されて保存される
⚠️  ワークフローログにも秘密鍵は表示されない
⚠️  SecretはマスクされてUI上で確認できない
```

### 秘密鍵の管理

```
✅ ローカルに安全に保管
✅ バックアップを取る
✅ 不要になったら削除
✅ 定期的に鍵をローテーション（推奨）
```

---

## 🚀 自動デプロイの開始

Secretsの設定が完了したら、以下の操作で自動デプロイが開始されます：

### パターン1: コードをpush

```bash
git add backend/
git commit -m "feat: 新機能追加"
git push origin main
```

→ **自動的にEC2にデプロイされます**

### パターン2: 手動実行

GitHubの **Actions** タブから **Run workflow** をクリック

---

## 📊 デプロイフロー

```
Git push to main
  ↓
GitHub Actions 起動
  ↓
backend/ の変更を検出
  ↓
1. SSH鍵を設定
2. ファイルをEC2に転送
3. サービスを再起動
4. 動作確認
  ↓
✅ デプロイ完了
  ↓
Slackに通知（オプション）
```

---

## 🔧 トラブルシューティング

### エラー: Permission denied (publickey)

**原因**: SSH鍵が正しく設定されていない

**解決**:
1. `EC2_SSH_KEY` の内容を確認
2. `-----BEGIN RSA PRIVATE KEY-----` と `-----END RSA PRIVATE KEY-----` が含まれているか確認
3. 改行が正しく含まれているか確認

### エラー: Host key verification failed

**原因**: EC2のホスト鍵が登録されていない

**解決**:
- ワークフローファイルに `ssh-keyscan` が含まれているか確認
- `.github/workflows/deploy-backend-to-ec2.yml` の内容を確認

### エラー: Service failed to start

**原因**: バックエンドの起動エラー

**解決**:
```powershell
# EC2のログを確認
ssh -i C:\Users\r_endo\Downloads\meeting-api-key.pem ec2-user@54.250.241.155 "sudo journalctl -u meeting-api -n 100"
```

---

## 📞 サポート

設定で困ったことがあれば、以下を確認してください：

1. **Secretsが正しく登録されているか**
   - Settings → Secrets and variables → Actions

2. **ワークフローファイルが正しいか**
   - `.github/workflows/deploy-backend-to-ec2.yml`

3. **EC2が正常に動作しているか**
   - `curl http://54.250.241.155:8000/health`

---

## 🔄 更新履歴

- **2025-10-19**: 初版作成
  - GitHub Secrets設定手順
  - トラブルシューティング

