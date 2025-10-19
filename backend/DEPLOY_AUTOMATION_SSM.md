# EC2自動デプロイ設定ガイド（SSM版）

AWS Systems Manager Session Managerを使った安全な自動デプロイ

---

## 🎯 概要

**AWS Systems Manager Session Manager (SSM)** を使用した自動デプロイシステム。

### メリット

- ✅ **SSHポート開放不要** - セキュリティリスクを最小化
- ✅ **GitHub Actionsから自動デプロイ** - mainブランチへのpushで自動実行
- ✅ **デプロイログを自動記録** - CloudWatch Logsに保存
- ✅ **エラー時の自動ロールバック** - デプロイ失敗時も安全

---

## 📋 初回セットアップ

### ステップ1: S3バケットの作成

**AWSコンソール**で実行：

1. **S3** → **バケットを作成**
2. **バケット名**: `meeting-api-deploy-bucket-111938288341`
3. **リージョン**: `ap-northeast-1`（東京）
4. **パブリックアクセスをすべてブロック**: ✅ チェック
5. **バケットを作成**

---

### ステップ2: EC2にIAMロールをアタッチ

#### 2-1: IAMロールを作成

**AWSコンソール**で実行：

1. **IAM** → **ロール** → **ロールを作成**
2. **信頼されたエンティティタイプ**: AWS サービス
3. **ユースケース**: EC2
4. **次へ**

5. **ポリシーをアタッチ**（2つ）:
   - ☑ `AmazonSSMManagedInstanceCore`（SSM用）
   - ☑ `AmazonS3ReadOnlyAccess`（S3からファイル取得用）

6. **次へ**
7. **ロール名**: `EC2-MeetingAPI-Role`
8. **ロールを作成**

#### 2-2: EC2にIAMロールをアタッチ

1. **EC2** → **インスタンス** → 対象のインスタンス（meeting-api-backend）を選択
2. **アクション** → **セキュリティ** → **IAMロールを変更**
3. **IAMロール**: `EC2-MeetingAPI-Role` を選択
4. **IAMロールの更新**

---

### ステップ3: SSM Agentの確認

EC2にSSH接続して確認：

```bash
sudo systemctl status amazon-ssm-agent
```

**出力例**:
```
● amazon-ssm-agent.service - amazon-ssm-agent
   Loaded: loaded
   Active: active (running)
```

Amazon Linux 2023にはデフォルトでインストール済みです。

---

### ステップ4: GitHub Secretsの設定

詳細は [`GITHUB_SECRETS_SSM.md`](./GITHUB_SECRETS_SSM.md) を参照してください。

**必要なSecrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_INSTANCE_ID`
- `S3_DEPLOY_BUCKET`

---

## 🚀 デプロイ方法

### 方法1: 自動デプロイ（推奨）

**mainブランチにpush**するだけで自動デプロイされます。

```bash
git add .
git commit -m "Update backend"
git push origin main
```

**backend/**配下のファイルが変更された場合のみ実行されます。

---

### 方法2: 手動デプロイ

GitHubから手動で実行：

1. **Actions** タブを開く
   ```
   https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc/actions
   ```

2. **Deploy Backend to EC2 (via SSM)** を選択

3. **Run workflow** → **Run workflow**

4. デプロイが開始されます

---

## 📊 デプロイフロー

```
┌─────────────────────────────────────────────────────────┐
│ 1. GitHub Actions がトリガーされる                        │
│    - mainブランチへのpush                                 │
│    - または手動実行（Run workflow）                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. バックエンドファイルをZIP化                             │
│    - app/                                               │
│    - run.py                                             │
│    - requirements.txt                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. S3バケットにアップロード                                │
│    s3://meeting-api-deploy-bucket-111938288341/         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. SSM経由でEC2にコマンド送信                              │
│    - S3からZIPをダウンロード                              │
│    - ファイルを~/backend/に展開                           │
│    - サービスを再起動                                      │
│    - 動作確認（/healthにアクセス）                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. デプロイ完了                                           │
│    - ログをGitHub Actionsに表示                           │
│    - S3の一時ファイルを削除                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 デプロイログの確認

### GitHub Actionsで確認

1. **Actions** タブ → 最新のワークフローを選択
2. **deploy** ジョブをクリック
3. **Show deployment logs** ステップを展開

**出力例**:
```
========================================
  EC2バックエンド自動デプロイ (SSM)
========================================

[1/4] S3からファイルをダウンロード中...
✅ ダウンロード完了

[2/4] ファイルを展開中...
✅ 展開完了

[3/4] サービスを再起動中...
✅ 再起動完了

[4/4] 動作確認中...
✅ 動作確認完了

========================================
  デプロイ完了！
========================================
```

---

### CloudWatch Logsで確認

**AWSコンソール**で確認：

1. **CloudWatch** → **ロググループ**
2. `/aws/ssm/AWS-RunShellScript` を選択
3. 最新のログストリームを開く

---

## 🔒 セキュリティ

### ✅ 実装済みのセキュリティ対策

1. **SSHポート開放不要**
   - SSM経由でのアクセスのみ
   - セキュリティグループでSSHポートを閉じることができる

2. **最小権限の原則**
   - IAMユーザーは必要な権限のみ付与
   - EC2は特定のS3バケットのみアクセス可能

3. **一時ファイルの自動削除**
   - デプロイ後にS3の一時ファイルを自動削除

4. **監査ログ**
   - CloudTrailでAPI呼び出しを記録
   - CloudWatch LogsでSSMコマンドを記録

---

### 🔧 推奨セキュリティ設定

#### セキュリティグループ（SSHポートを閉じる）

**現在**:
```
ポート 22: 0.0.0.0/0
```

**推奨**（SSM版では不要）:
```
ポート 22: 削除（または特定IPのみ）
```

**手順**:
1. **EC2** → **セキュリティグループ** → 対象のセキュリティグループ
2. **インバウンドルール** → **ルールを編集**
3. SSH（ポート22）のルールを削除または制限
4. **ルールを保存**

---

#### S3バケットのライフサイクルポリシー

**AWSコンソール**で設定：

1. **S3** → `meeting-api-deploy-bucket-111938288341`
2. **管理** → **ライフサイクルルールを作成**
3. **ルール名**: `DeleteOldDeployFiles`
4. **ルールスコープ**: このルールをバケット内のすべてのオブジェクトに適用
5. **ライフサイクルルールアクション**: オブジェクトの現在のバージョンを期限切れにする
6. **日数**: 7
7. **ルールを作成**

---

## ⚙️ トラブルシューティング

### エラー: "Instance is not managed by SSM"

**原因**: EC2にIAMロールがアタッチされていない

**解決方法**:
1. EC2にIAMロール `EC2-MeetingAPI-Role` をアタッチ
2. 5分待つ（SSM Agentが登録されるまで）
3. 再度デプロイを実行

---

### エラー: "Access Denied to S3"

**原因**: EC2のIAMロールにS3アクセス権限がない

**解決方法**:
1. IAMロール `EC2-MeetingAPI-Role` に `AmazonS3ReadOnlyAccess` をアタッチ
2. 再度デプロイを実行

---

### エラー: "Command execution timeout"

**原因**: SSMコマンドの実行に15分以上かかっている

**解決方法**:
1. EC2インスタンスにSSH接続
2. 手動でサービスの状態を確認
   ```bash
   sudo systemctl status meeting-api
   sudo journalctl -u meeting-api -n 50
   ```
3. 必要に応じて手動でサービスを再起動

---

### デプロイは成功したがサービスが起動しない

**確認方法**:
```bash
# EC2にSSH接続
ssh -i meeting-api-key.pem ec2-user@54.250.241.155

# サービスの状態確認
sudo systemctl status meeting-api

# ログ確認
sudo journalctl -u meeting-api -n 100

# 手動でサービス起動
sudo systemctl restart meeting-api
```

---

## 📊 デプロイ履歴の確認

### GitHub Actions

**Actions** タブで過去のデプロイ履歴を確認できます：

```
https://github.com/Ryota-Maruoka/meeting-facilitation-ai-poc/actions
```

---

### AWS Systems Manager

**AWSコンソール**で確認：

1. **Systems Manager** → **Run Command** → **コマンド履歴**
2. 過去30日間のコマンド実行履歴を確認可能

---

## 💰 コスト

### 月額料金（概算）

| サービス | 内容 | 月額料金 |
|---------|------|---------|
| **EC2** | t3.small（常時起動） | 約 $15 |
| **S3** | デプロイファイル保存（<1GB） | < $1 |
| **SSM** | Session Manager（無料） | $0 |
| **CloudWatch Logs** | ログ保存（<1GB） | < $1 |
| **合計** | | **約 $17/月** |

---

## 📚 関連ドキュメント

- [GITHUB_SECRETS_SSM.md](./GITHUB_SECRETS_SSM.md) - GitHub Secretsの設定方法
- [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) - EC2環境のセットアップ
- [AWS_SSM_SETUP.md](./AWS_SSM_SETUP.md) - SSMの詳細設定

---

## 🔄 旧バージョン（SSH版）からの移行

SSH版を使用している場合は、以下の手順で移行：

1. このドキュメントの **初回セットアップ** を実行
2. GitHub Secretsを設定
3. 新しいワークフロー（`.github/workflows/deploy-backend-to-ec2-ssm.yml`）をpush
4. 動作確認後、セキュリティグループからSSHポートを削除

---

**更新日**: 2025-10-19

