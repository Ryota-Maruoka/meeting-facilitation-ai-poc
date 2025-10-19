# AWS Systems Manager Session Manager セットアップ

GitHub ActionsからSSHを使わずにEC2にデプロイする方法

---

## 🎯 概要

AWS Systems Manager (SSM) Session Managerを使用すると、セキュリティグループでSSHポートを開放せずにEC2にアクセスできます。

---

## 📋 セットアップ手順

### ステップ1: EC2にIAMロールをアタッチ

1. **IAM** → **ロール** → **ロールを作成**

2. **信頼されたエンティティタイプ**: AWS サービス
3. **ユースケース**: EC2
4. **次へ** をクリック

5. **ポリシーをアタッチ**:
   - `AmazonSSMManagedInstanceCore`

6. **ロール名**: `EC2-SSM-Role`
7. **ロールを作成** をクリック

8. **EC2** → **インスタンス** → 対象のインスタンスを選択
9. **アクション** → **セキュリティ** → **IAMロールを変更**
10. **IAMロール**: `EC2-SSM-Role` を選択
11. **IAMロールの更新** をクリック

---

### ステップ2: SSM Agentの確認

Amazon Linux 2023にはデフォルトでSSM Agentがインストールされています。

確認コマンド：

```bash
sudo systemctl status amazon-ssm-agent
```

---

### ステップ3: GitHub Actionsワークフローを更新

`.github/workflows/deploy-backend-to-ec2.yml` を以下のように変更：

```yaml
name: Deploy Backend to EC2 (via SSM)

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - name: Deploy files via S3
        run: |
          cd backend
          zip -r backend.zip app/ run.py requirements.txt
          aws s3 cp backend.zip s3://${{ secrets.S3_DEPLOY_BUCKET }}/backend.zip

      - name: Deploy to EC2 via SSM
        run: |
          aws ssm send-command \
            --instance-ids ${{ secrets.EC2_INSTANCE_ID }} \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=[
              "cd /tmp",
              "aws s3 cp s3://${{ secrets.S3_DEPLOY_BUCKET }}/backend.zip .",
              "unzip -o backend.zip -d ~/backend/",
              "rm backend.zip",
              "sudo systemctl restart meeting-api"
            ]' \
            --output text
```

---

### ステップ4: GitHub Secretsを追加

- `AWS_ACCESS_KEY_ID`: AWSアクセスキー
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットキー
- `EC2_INSTANCE_ID`: EC2インスタンスID（例: i-0xxxxxxxx）
- `S3_DEPLOY_BUCKET`: S3バケット名（作成が必要）

---

## ⚠️ 注意事項

この方法は複雑なため、初期セットアップに時間がかかります。

**推奨**: セキュリティグループでGitHub ActionsのIPレンジを許可する方が簡単です。

---

## 📚 参考

- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [GitHub Actions IP Ranges](https://api.github.com/meta)

