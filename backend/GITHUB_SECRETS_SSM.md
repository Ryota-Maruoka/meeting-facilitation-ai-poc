# GitHub Secrets 設定ガイド（SSM版）

AWS Systems Manager Session Managerを使った自動デプロイに必要なGitHub Secretsの設定手順

---

## 📋 必要なSecrets一覧

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `AWS_ACCESS_KEY_ID` | AWS IAMユーザーのアクセスキーID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAMユーザーのシークレットアクセスキー | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `EC2_INSTANCE_ID` | EC2インスタンスID | `i-04f741b0d2a975ce0` |
| `S3_DEPLOY_BUCKET` | デプロイ用S3バケット名 | `meeting-api-deploy-bucket-111938288341` |

---

## 🔧 ステップ1: AWS IAMユーザーの作成

### 1-1: IAMユーザーを作成

**AWSコンソール**で実行：

1. **IAM** → **ユーザー** → **ユーザーを作成**

2. **ユーザー名**: `github-actions-deployer`

3. **次へ**

4. **許可を設定**:
   - **ポリシーを直接アタッチする** を選択

5. **ポリシーを作成**（新しいタブで開く）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSMSendCommand",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation"
      ],
      "Resource": [
        "arn:aws:ec2:ap-northeast-1:111938288341:instance/i-04f741b0d2a975ce0",
        "arn:aws:ssm:ap-northeast-1::document/AWS-RunShellScript"
      ]
    },
    {
      "Sid": "S3DeployBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::meeting-api-deploy-bucket-111938288341/*"
    }
  ]
}
```

6. **ポリシー名**: `GitHubActionsDeployPolicy`

7. **ポリシーを作成**

8. 元のタブに戻り、作成したポリシーを検索して選択

9. **次へ**

10. **ユーザーを作成**

---

### 1-2: アクセスキーを作成

1. 作成したユーザー（`github-actions-deployer`）をクリック

2. **セキュリティ認証情報** タブ

3. **アクセスキーを作成**

4. **ユースケース**: サードパーティサービス

5. **上記のレコメンデーションを理解し...** にチェック

6. **次へ**

7. **説明タグ**: `GitHub Actions deploy to EC2`

8. **アクセスキーを作成**

9. **アクセスキー** と **シークレットアクセスキー** をコピー
   - ⚠️ **シークレットアクセスキーは再表示できないため、必ず保存してください**

---

## 🔧 ステップ2: GitHub Secretsに登録

### GitHubリポジトリで実行：

1. GitHubリポジトリを開く
   ```
   https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc
   ```

2. **Settings** → **Secrets and variables** → **Actions**

3. **New repository secret** をクリック

---

### Secret 1: AWS_ACCESS_KEY_ID

- **Name**: `AWS_ACCESS_KEY_ID`
- **Secret**: （ステップ1-2でコピーしたアクセスキーID）
- **Add secret**

---

### Secret 2: AWS_SECRET_ACCESS_KEY

- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Secret**: （ステップ1-2でコピーしたシークレットアクセスキー）
- **Add secret**

---

### Secret 3: EC2_INSTANCE_ID

- **Name**: `EC2_INSTANCE_ID`
- **Secret**: `i-04f741b0d2a975ce0`
- **Add secret**

**EC2インスタンスIDの確認方法**:
```powershell
# AWSコンソール → EC2 → インスタンス
# 「meeting-api-backend」のインスタンスIDをコピー
```

---

### Secret 4: S3_DEPLOY_BUCKET

- **Name**: `S3_DEPLOY_BUCKET`
- **Secret**: `meeting-api-deploy-bucket-111938288341`
  - ⚠️ ステップ1で作成したS3バケット名を正確に入力
- **Add secret**

---

## ✅ 確認

すべてのSecretsが登録されたか確認：

```
GitHub → Settings → Secrets and variables → Actions
```

以下の4つが表示されていればOK：

- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`
- ✅ `EC2_INSTANCE_ID`
- ✅ `S3_DEPLOY_BUCKET`

---

## 🚀 テスト

### 手動実行でテスト

1. **Actions** タブを開く

2. **Deploy Backend to EC2 (via SSM)** を選択

3. **Run workflow** → **Run workflow**

4. ワークフローが成功すれば設定完了！

---

## 🔒 セキュリティのベストプラクティス

### ✅ 実施済み

- IAMユーザーに最小権限のみ付与
- EC2インスタンスとS3バケットを明示的に指定
- SSHポート22を開放する必要なし

### 🔧 推奨事項

1. **定期的にアクセスキーをローテーション**
   - 3ヶ月ごとに新しいアクセスキーを作成
   - 古いアクセスキーを削除

2. **CloudTrailでアクセスログを監視**
   - 不審なAPI呼び出しを検出

3. **S3バケットのライフサイクルポリシー**
   ```json
   {
     "Rules": [
       {
         "Id": "DeleteOldDeployFiles",
         "Status": "Enabled",
         "Expiration": {
           "Days": 7
         }
       }
     ]
   }
   ```

---

## 📚 参考

- [AWS IAM ベストプラクティス](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

