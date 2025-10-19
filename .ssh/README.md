# SSH鍵ディレクトリ

このディレクトリにEC2へのSSH接続用の秘密鍵を配置します。

---

## 📁 配置するファイル

```
.ssh/
└── meeting-api-key.pem  ← EC2のSSH秘密鍵
```

---

## 🔧 セットアップ手順

### ステップ1: SSH鍵を取得

AWSコンソールからダウンロードした `meeting-api-key.pem` を用意してください。

### ステップ2: このディレクトリに配置

**PowerShell**で実行：

```powershell
# プロジェクトルートから実行
Copy-Item ~\Downloads\meeting-api-key.pem .\.ssh\
```

または、手動でコピー：

1. エクスプローラーで `meeting-api-key.pem` を開く
2. このディレクトリ（`.ssh/`）に貼り付け

---

## ✅ 確認

**PowerShell**で実行：

```powershell
# ファイルが存在するか確認
Test-Path .\.ssh\meeting-api-key.pem
```

**期待される結果**: `True`

---

## 🔒 セキュリティ

- ✅ このディレクトリは `.gitignore` で除外されています
- ✅ SSH秘密鍵はGitにコミットされません
- ⚠️ **秘密鍵を絶対に公開しないでください**

---

## 📝 トラブルシューティング

### エラー: SSH鍵が見つかりません

**原因**: ファイルが正しい場所にない

**解決**:
```powershell
# ファイルの存在を確認
ls .\.ssh\

# もし空なら、再度コピー
Copy-Item ~\Downloads\meeting-api-key.pem .\.ssh\
```

---

## 🚀 使い方

デプロイスクリプトが自動的にこのディレクトリから秘密鍵を参照します：

```powershell
cd backend
.\deploy-to-ec2.ps1
```

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. ファイル名が正しいか（`meeting-api-key.pem`）
2. ファイルの場所が正しいか（`.ssh/` 直下）
3. ファイルの権限が正しいか（読み取り可能）

