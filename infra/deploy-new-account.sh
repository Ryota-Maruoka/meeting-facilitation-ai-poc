#!/bin/bash

# 環境変数の設定（新しいAWSアカウント 111938288341）
CUSTOMER_NAME="bemac"
PROJECT_NAME="meeting"
ENVIRONMENT="dev"
SYSTEM_NAME="bemac-meeting-system"
REGION="ap-northeast-1"
DOMAIN_NAME="bemac-meeting.fr-aicompass.com"
SERVICE_NAME="meeting"
# 新しいAWSアカウント用の証明書ARN（要確認・更新）
DOMAIN_CERTIFICATE_ARN="arn:aws:acm:ap-northeast-1:111938288341:certificate/[CERTIFICATE_ID]"
ECR_REPOSITORY_NAME="meeting-repository"

# 個別｜スタック名の定義
SECRETS_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-secrets"
FE_ECR_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-fe-ecr"
BE_ECR_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-ecr"
FE_ALB_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-fe-alb"
FE_ECS_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-fe-ecs"
FE_WAF_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-fe-waf"
BE_DOMAIN_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-domain"
BE_ALB_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-alb"
BE_ECS_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-ecs"
BE_SQS_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-sqs"
BE_WORKER_STACK="${CUSTOMER_NAME}-${PROJECT_NAME}-${ENVIRONMENT}-be-worker"

echo "=========================================="
echo "  Meeting Facilitation AI PoC"
echo "  AWS Account: 111938288341"
echo "  Environment: ${ENVIRONMENT}"
echo "=========================================="

# 各スタックのデプロイ

# ----------------------------------------------------------------------------- #
# シークレット管理
# ----------------------------------------------------------------------------- #
echo "Creating secrets stack..."
aws cloudformation create-stack \
  --stack-name ${SECRETS_STACK} \
  --template-body file://07_secrets.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
    ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
    ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
  --tags \
    Key=customer,Value=${CUSTOMER_NAME} \
    Key=project,Value=${PROJECT_NAME} \
    Key=environment,Value=${ENVIRONMENT} \
    Key=system,Value=${SYSTEM_NAME}

# ----------------------------------------------------------------------------- #
# フロントエンド - ECR
# ----------------------------------------------------------------------------- #
echo "Creating frontend ECR stack..."
aws cloudformation create-stack \
  --stack-name ${FE_ECR_STACK} \
  --template-body file://11_fe_ecr.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
    ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
    ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
  --tags \
    Key=customer,Value=${CUSTOMER_NAME} \
    Key=project,Value=${PROJECT_NAME} \
    Key=environment,Value=${ENVIRONMENT} \
    Key=system,Value=${SYSTEM_NAME}

# ----------------------------------------------------------------------------- #
# バックエンド - ECR
# ----------------------------------------------------------------------------- #
echo "Creating backend ECR stack..."
aws cloudformation create-stack \
  --stack-name ${BE_ECR_STACK} \
  --template-body file://21_be_ecr.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
    ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
    ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
  --tags \
    Key=customer,Value=${CUSTOMER_NAME} \
    Key=project,Value=${PROJECT_NAME} \
    Key=environment,Value=${ENVIRONMENT} \
    Key=system,Value=${SYSTEM_NAME}

echo "=========================================="
echo "  Infrastructure deployment completed!"
echo "  Next steps:"
echo "  1. Update GitHub Secrets with new AWS credentials"
echo "  2. Update domain certificate ARN"
echo "  3. Update ImportValue references in CloudFormation templates"
echo "  4. Deploy remaining stacks (ALB, ECS, etc.)"
echo "=========================================="


