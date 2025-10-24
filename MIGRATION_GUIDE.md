# AWS環境統一・EC2からECS移行手順書

## 📋 概要

文字起こし要約アプリのAWS環境を統一し、バックエンドをEC2からECSに移行する手順書です。

### 🎯 目標
- **AWSアカウント統一**: 111938288341
- **バックエンド移行**: EC2 → ECS
- **フロントエンド**: 既存ECS構成を維持

## 🔍 現在の状況

### フロントエンド（ECS）
- AWSアカウント: `688567301060` → `111938288341`
- デプロイ方法: ECS + ECR
- ワークフロー: `api-deploy.yml`

### バックエンド（EC2 → ECS）
- AWSアカウント: 不明 → `111938288341`
- デプロイ方法: EC2 + SSM → ECS + ECR
- ワークフロー: `deploy-backend-to-ec2-ssm.yml` → `deploy-backend-to-ecs.yml`

## 🚀 移行手順

### Phase 1: 新しいAWSアカウントでのインフラ構築

#### 1.1 VPCとネットワーク構築
```bash
cd infra
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-vpc \
  --template-body file://00_vpc.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=bemac \
    ParameterKey=ProjectName,ParameterValue=meeting \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=SystemName,ParameterValue=bemac-meeting-system \
  --tags \
    Key=customer,Value=bemac \
    Key=project,Value=meeting \
    Key=environment,Value=dev \
    Key=system,Value=bemac-meeting-system
```

#### 1.2 シークレット管理
```bash
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-secrets \
  --template-body file://07_secrets.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=bemac \
    ParameterKey=ProjectName,ParameterValue=meeting \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=SystemName,ParameterValue=bemac-meeting-system
```

#### 1.3 ECRリポジトリ作成
```bash
# フロントエンドECR
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-fe-ecr \
  --template-body file://11_fe_ecr.yml

# バックエンドECR
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-be-ecr \
  --template-body file://21_be_ecr.yml
```

#### 1.4 ALB構築
```bash
# フロントエンドALB
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-fe-alb \
  --template-body file://12_fe_alb.yml \
  --parameters \
    ParameterKey=DomainCertificateArn,ParameterValue="arn:aws:acm:ap-northeast-1:111938288341:certificate/[CERTIFICATE_ID]"

# バックエンドALB
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-be-alb \
  --template-body file://22_be_alb.yml
```

#### 1.5 ECSクラスター構築
```bash
# フロントエンドECS
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-fe-ecs \
  --template-body file://13_fe_ecs.yml \
  --capabilities CAPABILITY_NAMED_IAM

# バックエンドECS
aws cloudformation create-stack \
  --stack-name bemac-meeting-dev-be-ecs \
  --template-body file://24_be_ecs.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

### Phase 2: GitHub Secrets更新

#### 2.1 新しいAWSアカウントの認証情報設定
GitHubリポジトリのSettings > Secrets and variables > Actionsで以下を設定：

```
AWS_ACCESS_KEY_ID: [新しいアカウントのアクセスキー]
AWS_SECRET_ACCESS_KEY: [新しいアカウントのシークレットキー]
```

#### 2.2 ドメイン証明書ARN更新
新しいAWSアカウントでSSL証明書を作成し、ARNを更新：
```
DOMAIN_CERTIFICATE_ARN: arn:aws:acm:ap-northeast-1:111938288341:certificate/[CERTIFICATE_ID]
```

### Phase 3: アプリケーション移行

#### 3.1 フロントエンド移行
```bash
# 新しいワークフローでデプロイ
git push origin main
# または手動実行: Actions > Deploy API app to ECS via ECR > Run workflow
```

#### 3.2 バックエンド移行
```bash
# 新しいECSワークフローでデプロイ
git push origin main
# または手動実行: Actions > Deploy Backend to ECS > Run workflow
```

### Phase 4: 動作確認

#### 4.1 ヘルスチェック
```bash
# フロントエンド
curl https://[DOMAIN_NAME]/health

# バックエンド
curl https://[BACKEND_DOMAIN]/health
```

#### 4.2 機能テスト
- 文字起こし機能
- 要約機能
- 会議履歴機能

## 📁 更新されたファイル

### インフラ設定
- `infra/00_vpc.yml` - 新規VPC設定
- `infra/deploy-new-account.sh` - 新アカウント用デプロイスクリプト
- `infra/24_be_ecs.yml` - ImportValue更新
- `infra/22_be_alb.yml` - ImportValue更新
- `infra/12_fe_alb.yml` - ImportValue更新
- `infra/13_fe_ecs.yml` - ImportValue更新
- `infra/15_be_domain.yml` - ImportValue更新

### GitHub Actions
- `.github/workflows/api-deploy.yml` - AWSアカウントID更新
- `.github/workflows/deploy-backend-to-ecs.yml` - 新規ECSデプロイワークフロー
- `.github/docker/backend/Dockerfile` - バックエンド用Dockerfile

## ⚠️ 注意事項

### 事前準備
1. **ドメイン証明書**: 新しいAWSアカウントでSSL証明書を作成
2. **DNS設定**: Route53でドメイン設定
3. **セキュリティグループ**: 適切なポート開放設定
4. **IAMロール**: ECSタスク用の適切な権限設定

### 移行時の考慮事項
1. **ダウンタイム**: 移行中はサービス停止
2. **データ移行**: 既存データの移行が必要な場合
3. **設定値**: 環境変数やシークレットの移行
4. **ログ**: CloudWatch Logsの設定確認

### ロールバック計画
1. 既存EC2環境の保持
2. DNS切り替えによる段階的移行
3. 問題発生時の即座な切り戻し

## 🔧 トラブルシューティング

### よくある問題
1. **ImportValueエラー**: VPCスタックが先に作成されているか確認
2. **権限エラー**: IAMロールの権限設定確認
3. **ネットワークエラー**: セキュリティグループの設定確認
4. **証明書エラー**: SSL証明書のドメイン名確認

### 確認コマンド
```bash
# CloudFormationスタック状況確認
aws cloudformation describe-stacks --stack-name bemac-meeting-dev-vpc

# ECSサービス状況確認
aws ecs describe-services --cluster bemac-meeting-dev-be-cluster --services bemac-meeting-dev-be-service

# ALB状況確認
aws elbv2 describe-load-balancers --names bemac-meeting-dev-be-alb
```

## 📞 サポート

移行中に問題が発生した場合は、以下を確認してください：
1. CloudFormationイベント
2. ECSタスクログ
3. ALBヘルスチェック状況
4. セキュリティグループ設定


