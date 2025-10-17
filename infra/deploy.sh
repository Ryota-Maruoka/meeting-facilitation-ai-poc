#!/bin/bash

# 環境変数の設定
CUSTOMER_NAME="bemac"
PROJECT_NAME="meeting"
ENVIRONMENT="dev"
SYSTEM_NAME="bemac-meeting-system"
REGION="ap-northeast-1"
DOMAIN_NAME="bemac-meeting.fr-aicompass.com"
SERVICE_NAME="meeting"
# DB_USERNAME="AICOMPASSadmin"
# DB_PASSWORD="AICOMPASSadmin" 
DOMAIN_CERTIFICATE_ARN="arn:aws:acm:ap-northeast-1:688567301060:certificate/1be14353-9dc4-47f7-b811-52ba84e9457f"
# USER_POOL_ARN="arn:aws:cognito-idp:ap-northeast-1:688567301060:userpool/ap-northeast-1_6PV70QiOk" 
ECR_REPOSITORY_NAME="accounting-repository"

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

# 各スタックのデプロイ

# ----------------------------------------------------------------------------- #
# シークレット管理
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${SECRETS_STACK} \
#   --template-body file://07_secrets.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# ----------------------------------------------------------------------------- #
# フロントエンド - ECR
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${FE_ECR_STACK} \
#   --template-body file://11_fe_ecr.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# ----------------------------------------------------------------------------- #
# バックエンド - ECR
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${BE_ECR_STACK} \
#   --template-body file://21_be_ecr.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# ----------------------------------------------------------------------------- #
# フロントエンド - ALB
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${FE_ALB_STACK} \
#   --template-body file://12_fe_alb.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#     ParameterKey=DomainCertificateArn,ParameterValue=${DOMAIN_CERTIFICATE_ARN} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}

# aws cloudformation update-stack \
#   --stack-name ${FE_ALB_STACK} \
#   --template-body file://12_fe_alb.yml \
#   --parameters \
#     ParameterKey=DomainCertificateArn,ParameterValue=${DOMAIN_CERTIFICATE_ARN} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# ----------------------------------------------------------------------------- #
# フロントエンド - ECS
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${FE_ECS_STACK} \
#   --template-body file://13_fe_ecs.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#   --capabilities CAPABILITY_NAMED_IAM \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}

# aws cloudformation update-stack \
#   --stack-name ${FE_ECS_STACK} \
#   --template-body file://13_fe_ecs.yml \
#   --capabilities CAPABILITY_NAMED_IAM \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# ----------------------------------------------------------------------------- #
# フロントエンド - WAF
# ----------------------------------------------------------------------------- #
# aws cloudformation create-stack \
#   --stack-name ${FE_WAF_STACK} \
#   --template-body file://14_fe_waf.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#     ParameterKey=AllowedIPAddresses,ParameterValue="150.249.196.118/32" \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}

# aws cloudformation update-stack \
#   --stack-name ${FE_WAF_STACK} \
#   --template-body file://14_fe_waf.yml \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}

### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
### Domain Backend
### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
# aws cloudformation create-stack \
#   --stack-name ${BE_DOMAIN_STACK} \
#   --template-body file://15_be_domain.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#     ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}

### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
### ALB Backend
### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
# aws cloudformation create-stack \
#   --stack-name ${BE_ALB_STACK} \
#   --template-body file://22_be_alb.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#     ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}


# aws cloudformation update-stack \
#   --stack-name ${BE_ALB_STACK} \
#   --template-body file://22_be_alb.yml \
#   --profile ai-canvas \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME} \

### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
### ECS Backend
### -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ###
aws cloudformation create-stack \
  --stack-name ${BE_ECS_STACK} \
  --template-body file://24_be_ecs.yml \
  --parameters \
    ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
    ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
    ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
    ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
  --profile ai-canvas \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags \
    Key=customer,Value=${CUSTOMER_NAME} \
    Key=project,Value=${PROJECT_NAME} \
    Key=environment,Value=${ENVIRONMENT} \
    Key=system,Value=${SYSTEM_NAME}

# aws cloudformation update-stack \
#   --stack-name ${BE_ECS_STACK} \
#   --template-body file://24_be_ecs.yml \
#   --parameters \
#     ParameterKey=CustomerName,ParameterValue=${CUSTOMER_NAME} \
#     ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
#     ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
#     ParameterKey=SystemName,ParameterValue=${SYSTEM_NAME} \
#     ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
#   --profile ai-canvas \
#   --capabilities CAPABILITY_NAMED_IAM \
#   --tags \
#     Key=customer,Value=${CUSTOMER_NAME} \
#     Key=project,Value=${PROJECT_NAME} \
#     Key=environment,Value=${ENVIRONMENT} \
#     Key=system,Value=${SYSTEM_NAME}
