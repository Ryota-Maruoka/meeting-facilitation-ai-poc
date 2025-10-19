# 本番環境デプロイガイド（Vercel + AWS EC2）

実際に本番環境にデプロイした構成と手順

## 📊 本番環境の構成

```
┌─────────────────────────────────────────┐
│ フロントエンド                           │
│ Vercel                                  │
│ https://bemac-meeting.fr-aicompass.com  │
│ ✅ Next.js 14                            │
│ ✅ 無料プラン                            │
└──────────────┬──────────────────────────┘
               │
               │ API呼び出し
               ↓
┌─────────────────────────────────────────┐
│ バックエンド                             │
│ AWS EC2 (t3.small)                      │
│ AWS アカウント: 111938288341            │
│ http://54.250.241.155:8000              │
│ ✅ FastAPI                               │
│ ✅ Python版Whisper（完全無料）           │
│ ✅ Elastic IPで固定化                    │
└─────────────────────────────────────────┘
```

---

## 💰 コスト

| 項目 | 月間コスト |
|------|-----------|
| Vercel（フロントエンド） | **0円**（無料プラン） |
| AWS EC2 t3.small | **約2,250円**（東京リージョン） |
| Elastic IP | **0円**（実行中のインスタンスに関連付け） |
| Python版Whisper | **0円**（ローカル実行） |
| **合計** | **約2,250円/月** |

**注**: 無料利用枠（750時間/月）を使い切った場合の料金です。

---

## 🚀 デプロイ手順

### Part 1: EC2バックエンドのセットアップ

#### 1-1. EC2インスタンスの作成

```
AMI: Amazon Linux 2023
インスタンスタイプ: t2.micro（無料枠）
ストレージ: 20 GiB
セキュリティグループ:
  - SSH (22): マイIPから
  - HTTP (8000): 0.0.0.0/0
```

#### 1-2. SSH接続

```bash
ssh -i your-key.pem ec2-user@<EC2のIP>
```

#### 1-3. 必要なソフトウェアのインストール

```bash
# システム更新とツールインストール
sudo dnf update -y
sudo dnf install -y python3.11 python3.11-pip git cmake gcc-c++
```

#### 1-4. プロジェクトの転送

**ローカルPC（別のPowerShellウィンドウ）で実行**:

```powershell
scp -i C:\path\to\your-key.pem -r C:\path\to\project\backend ec2-user@<EC2のIP>:~/
```

#### 1-5. Python依存関係のインストール

**EC2内で実行**:

```bash
cd ~/backend

# requirements.txtから一括インストール
pip3.11 install --user -r requirements.txt

# Python Whisperをインストール（重要）
pip3.11 install --user torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip3.11 install --user openai-whisper
pip3.11 install --user python-multipart
```

#### 1-6. 環境変数の設定

```bash
cat > .env << 'EOF'
# ASR設定（Python版Whisper）
ASR_PROVIDER=python_whisper
ASR_LANGUAGE=ja

# Azure OpenAI設定（会議要約用）
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION_RESPONSES=2025-04-01
AZURE_OPENAI_API_VERSION_CHAT=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
DEFAULT_TIMEZONE=Asia/Tokyo

# CORS設定（フロントエンドのURLを指定）
CORS_ORIGINS=https://bemac-meeting.fr-aicompass.com

# データディレクトリ
DATA_DIR=./data
SUMMARIES_DIR=./data/summaries

# デバッグモード
DEBUG=false
EOF
```

#### 1-7. データディレクトリの作成

```bash
mkdir -p data/meetings data/summaries
```

#### 1-8. サーバーのテスト起動

```bash
python3.11 run.py server --host 0.0.0.0 --port 8000
```

別のターミナルで確認:
```bash
curl http://localhost:8000/health
# {"ok":true} が返ればOK
```

動作確認できたら、`Ctrl + C` でサーバーを停止。

#### 1-9. systemdサービス化（自動起動設定）

```bash
# サービスファイルを作成
sudo tee /etc/systemd/system/meeting-api.service > /dev/null << 'EOF'
[Unit]
Description=Meeting Facilitation API with Python Whisper
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/backend
Environment="PATH=/home/ec2-user/.local/bin:/usr/bin"
ExecStart=/usr/bin/python3.11 run.py server --host 0.0.0.0 --port 8000 --no-reload
Restart=always
RestartSec=10
StandardOutput=append:/var/log/meeting-api/app.log
StandardError=append:/var/log/meeting-api/error.log

[Install]
WantedBy=multi-user.target
EOF

# ログディレクトリを作成
sudo mkdir -p /var/log/meeting-api
sudo chown ec2-user:ec2-user /var/log/meeting-api

# サービスを有効化して起動
sudo systemctl daemon-reload
sudo systemctl enable meeting-api
sudo systemctl start meeting-api

# ステータス確認
sudo systemctl status meeting-api
```

#### 1-10. 外部からの動作確認

**ローカルPC（PowerShell）で実行**:

```powershell
curl http://<EC2のパブリックIP>:8000/health
```

---

### Part 2: Vercelフロントエンドの設定

#### 2-1. Vercel Dashboardにログイン

https://vercel.com/dashboard

#### 2-2. プロジェクトを選択

`bemac-meeting` などのプロジェクト名をクリック

#### 2-3. 環境変数の設定

1. **Settings** タブをクリック
2. 左側のメニューで **Environment Variables** をクリック
3. **Add New** をクリック
4. 以下を入力:

```
Key: NEXT_PUBLIC_API_URL
Value: http://<EC2のパブリックIP>:8000
Environments: Production, Preview, Development（すべて選択）
```

**例**:
```
Key: NEXT_PUBLIC_API_URL
Value: http://52.192.167.208:8000
```

5. **Save** をクリック

#### 2-4. 再デプロイ

1. **Deployments** タブに移動
2. 最新のデプロイの右側の **「...」** をクリック
3. **「Redeploy」** をクリック
4. **「Redeploy」** を再度クリックして確認

#### 2-5. デプロイ完了を待つ

ステータスが **「Ready」** になるまで待つ（約1-2分）

---

### Part 3: 動作確認

#### 3-1. フロントエンドにアクセス

ブラウザで開く:
```
https://bemac-meeting.fr-aicompass.com/
```

#### 3-2. 機能テスト

1. **会議を作成**
   - 「新規会議作成」ボタンをクリック
   - タイトル、目的、アジェンダを入力
   - 作成

2. **会議を開始**
   - 作成した会議を開く
   - 「会議開始」ボタンをクリック

3. **文字起こし機能をテスト**
   - 音声ファイルをアップロード
   - 文字起こしが正常に動作するか確認

---

## 🔧 運用管理

### EC2サーバーの管理

#### ログ確認

```bash
# リアルタイムログ
sudo journalctl -u meeting-api -f

# 過去のログ
sudo journalctl -u meeting-api -n 100
```

#### サービスの再起動

```bash
sudo systemctl restart meeting-api
```

#### サービスの停止

```bash
sudo systemctl stop meeting-api
```

#### サービスの起動

```bash
sudo systemctl start meeting-api
```

#### サービスのステータス確認

```bash
sudo systemctl status meeting-api
```

---

### Vercelの管理

#### 環境変数の変更

1. Vercel Dashboard → プロジェクト → Settings → Environment Variables
2. 変更したい変数の **「Edit」** をクリック
3. 値を変更して **「Save」**
4. Deploymentsタブから **「Redeploy」**

#### デプロイログの確認

1. Deployments タブ
2. デプロイをクリック
3. **「View Function Logs」** または **「Building」** をクリック

---

## 🛠️ トラブルシューティング

### EC2関連

#### エラー: サービスが起動しない

```bash
# ログを確認
sudo journalctl -u meeting-api -n 50

# 手動で起動してエラーを確認
cd ~/backend
python3.11 run.py server --host 0.0.0.0 --port 8000
```

#### エラー: ポート8000にアクセスできない

```bash
# セキュリティグループを確認
# AWS Console → EC2 → セキュリティグループ
# インバウンドルールでポート8000が開放されているか確認
```

#### エラー: メモリ不足

t2.microは1GBのメモリしかないため、メモリ不足になる可能性があります。

**対策**:
```bash
# スワップファイルを作成
sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

### Vercel関連

#### エラー: APIにアクセスできない

**確認項目**:
1. 環境変数 `NEXT_PUBLIC_API_URL` が正しく設定されているか
2. 再デプロイを実行したか
3. EC2のセキュリティグループでポート8000が開放されているか

**デバッグ方法**:
```javascript
// ブラウザのコンソール（F12）で確認
console.log(process.env.NEXT_PUBLIC_API_URL);
```

#### エラー: CORSエラー

EC2の`.env`ファイルで `CORS_ORIGINS` が正しく設定されているか確認:

```bash
# EC2で確認
cat ~/backend/.env | grep CORS_ORIGINS
```

正しい値:
```
CORS_ORIGINS=https://bemac-meeting.fr-aicompass.com
```

変更した場合は再起動:
```bash
sudo systemctl restart meeting-api
```

---

## 📈 今後の拡張

### HTTPSの導入

現在はHTTPですが、HTTPSにするには：

1. **ドメイン設定**: Route 53でサブドメインを設定
2. **ALBの追加**: Application Load Balancerを追加
3. **ACM証明書**: AWS Certificate Managerで証明書を取得
4. **ALB設定**: HTTPSリスナーを追加してEC2にルーティング

### オートスケーリング

ユーザーが増えた場合：

1. AMIを作成（現在のEC2の設定を保存）
2. Auto Scaling Groupを作成
3. ALBでロードバランシング

### モニタリング

本格運用には：

1. **CloudWatch Alarms**: CPU使用率、メモリ使用率を監視
2. **CloudWatch Logs**: ログを集約
3. **SNS通知**: 異常時にメール通知

---

## 📝 メモ

### EC2のパブリックIP（Elastic IP）

```
現在のIP: 54.250.241.155
```

**重要**: Elastic IPで固定化されているため、インスタンスを停止・起動してもIPアドレスは変わりません。

**対策**:
- Elastic IPを割り当てる（無料、使用中のみ）
- または、ドメイン（Route 53）を使用する

### 無料利用枠の制限

| 項目 | 無料枠 | 超過後の料金 |
|------|--------|------------|
| EC2 t2.micro | 750時間/月 | 約$0.012/時間 |
| EBS ストレージ | 30GB | $0.10/GB/月 |
| データ転送（out） | 100GB/月 | $0.09/GB |

---

## 🎯 まとめ

```
【完成した構成】

フロントエンド:
  ✅ Vercel (無料)
  ✅ https://bemac-meeting.fr-aicompass.com/

バックエンド:
  ✅ AWS EC2 t2.micro (無料枠)
  ✅ Python版Whisper (完全無料)
  ✅ http://52.192.167.208:8000

月間コスト: 0円（無料枠内）
```

---

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. EC2のログ: `sudo journalctl -u meeting-api -f`
2. Vercelのデプロイログ
3. ブラウザのコンソール（F12）

---

**デプロイ完了日**: 2025年10月18日

