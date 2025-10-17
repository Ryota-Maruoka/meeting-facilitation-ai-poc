# 環境構築手順（初心者向け）

このガイドでは、Meeting Facilitation AI PoCを初めて使う方でも、ステップバイステップで環境を構築できるように説明します。

## 📋 目次

1. [必要なソフトウェアのインストール](#1-必要なソフトウェアのインストール)
2. [プロジェクトのダウンロード](#2-プロジェクトのダウンロード)
3. [バックエンドのセットアップ](#3-バックエンドのセットアップ)
4. [フロントエンドのセットアップ](#4-フロントエンドのセットアップ)
5. [動作確認](#5-動作確認)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 必要なソフトウェアのインストール

### 1.1 Python のインストール

**Pythonとは？**  
バックエンド（サーバー側）のプログラムを動かすために必要なプログラミング言語です。

**インストール手順：**

1. [Python公式サイト](https://www.python.org/downloads/) にアクセス
2. **Python 3.11** 以上のバージョンをダウンロード
3. インストーラーを実行
   - ⚠️ **重要**: インストール時に「**Add Python to PATH**」に必ずチェックを入れてください
4. インストール完了後、PowerShellまたはコマンドプロンプトを開いて確認：

```powershell
python --version
```

`Python 3.11.x` のように表示されればOKです。

### 1.2 Node.js のインストール

**Node.jsとは？**  
フロントエンド（画面側）のプログラムを動かすために必要な実行環境です。

**インストール手順：**

1. [Node.js公式サイト](https://nodejs.org/) にアクセス
2. **LTS版**（推奨版）をダウンロード
3. インストーラーを実行（デフォルト設定でOK）
4. インストール完了後、PowerShellまたはコマンドプロンプトを開いて確認：

```powershell
node --version
npm --version
```

両方ともバージョン番号が表示されればOKです。

### 1.3 Git のインストール（オプション）

**Gitとは？**  
プロジェクトのソースコードをダウンロード・管理するためのツールです。

**インストール手順：**

1. [Git公式サイト](https://git-scm.com/downloads) にアクセス
2. Windows版をダウンロード
3. インストーラーを実行（デフォルト設定でOK）
4. インストール完了後、PowerShellまたはコマンドプロンプトを開いて確認：

```powershell
git --version
```

---

## 2. プロジェクトのダウンロード

### 方法A: Gitを使う場合（推奨）

PowerShellまたはコマンドプロンプトを開いて、以下を実行：

```powershell
# プロジェクトを保存したいフォルダに移動（例：デスクトップ）
cd C:\Users\<あなたのユーザー名>\Desktop

# プロジェクトをダウンロード
git clone https://github.com/<リポジトリのURL>
cd meeting-facilitation-ai-poc
```

### 方法B: ZIPファイルでダウンロードする場合

1. GitHubのプロジェクトページにアクセス
2. 緑色の「Code」ボタンをクリック
3. 「Download ZIP」を選択
4. ダウンロードしたZIPファイルを解凍
5. 解凍したフォルダに移動

---

## 3. バックエンドのセットアップ

### 3.1 バックエンドフォルダに移動

PowerShellを開いて、プロジェクトのバックエンドフォルダに移動します：

```powershell
cd C:\Users\<あなたのユーザー名>\Desktop\meeting-facilitation-ai-poc\backend
```

### 3.2 仮想環境の作成

**仮想環境とは？**  
このプロジェクト専用のPython環境を作ることで、他のプロジェクトと干渉しないようにします。

```powershell
python -m venv .venv
```

### 3.3 仮想環境の有効化

```powershell
.\.venv\Scripts\Activate.ps1
```

**⚠️ エラーが出た場合：**

PowerShellの実行ポリシーが制限されている可能性があります。以下を実行してください：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

その後、再度仮想環境を有効化してください。

**成功すると：**  
プロンプトの先頭に `(.venv)` が表示されます。

```
(.venv) PS C:\Users\...\backend>
```

### 3.4 必要なパッケージのインストール

```powershell
pip install -r requirements.txt
```

インストールには数分かかる場合があります。

**⚠️ Whisper関連の注意事項:**
- このプロジェクトは**Whisper.cpp**を使用します
- `main.exe`実行ファイルと`ggml-base.bin`モデルファイルが必要です
- これらは手動でダウンロードする必要があります（約1.5GB）

### 3.5 環境変数ファイルの作成

環境変数ファイル（`.env`）を作成します。このファイルには、APIキーなどの設定情報を記述します。

**`.env.example` をコピーして `.env` を作成します：**

```powershell
# .env.exampleから.envを作成
Copy-Item .env.example .env
```

または、以下のコマンドでも可能です：

```powershell
copy .env.example .env
```

作成された `.env` ファイルには以下の設定が含まれています：
- `DATA_DIR`: データ保存先ディレクトリ（デフォルト: `./data`）
- `SLACK_WEBHOOK_URL`: Slack連携用のWebhook URL（オプション）

**注意**: 
- 現時点ではデフォルト設定のままで動作します
- データは自動的に `backend/data/` ディレクトリに保存されます（自動作成）
- Slack連携を使う場合のみ `SLACK_WEBHOOK_URL` を設定してください

### 3.6 バックエンドサーバーの起動

```powershell
python run.py
```

**成功すると：**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

のようなメッセージが表示されます。

ブラウザで http://localhost:8000/docs にアクセスすると、API仕様書（Swagger UI）が表示されます。

**サーバーを停止するには：**  
`Ctrl + C` を押します。

---

## 4. フロントエンドのセットアップ

### 4.1 新しいPowerShellウィンドウを開く

バックエンドサーバーは起動したまま、**別のPowerShellウィンドウ**を開きます。

**ヒント**: バックエンドとフロントエンドは同時に起動する必要があります。

### 4.2 フロントエンドフォルダに移動

```powershell
cd C:\Users\<あなたのユーザー名>\Desktop\meeting-facilitation-ai-poc\frontend
```

### 4.3 必要なパッケージのインストール

```powershell
npm install
```

インストールには数分かかる場合があります。

### 4.4 フロントエンドサーバーの起動

```powershell
npm run dev
```

**成功すると：**

```
- Local:        http://localhost:3000
```

のようなメッセージが表示されます。

ブラウザで http://localhost:3000 にアクセスすると、フロントエンド画面が表示されます。

**サーバーを停止するには：**  
`Ctrl + C` を押します。

---

## 5. 動作確認

### 5.1 バックエンドの確認

1. バックエンドサーバーが起動していることを確認
2. ブラウザで http://localhost:8000/docs にアクセス
3. API仕様書が表示されればOK

### 5.2 フロントエンドの確認

1. フロントエンドサーバーが起動していることを確認
2. ブラウザで http://localhost:3000 にアクセス
3. 「Meeting Facilitation PoC」のトップ画面が表示されればOK
4. 以下の機能が利用可能です：
   - **新規会議作成**: 会議のメタ情報とアジェンダを入力（画面A）
   - **議事録履歴一覧**: 過去の会議履歴を確認

### 5.3 両方を同時に起動

- **PowerShellウィンドウ1**: バックエンドサーバー（`python run.py`）
- **PowerShellウィンドウ2**: フロントエンドサーバー（`npm run dev`）

両方を起動した状態で、フロントエンドからバックエンドのAPIを呼び出すことができます。

**確認方法:**
- バックエンドAPI: http://localhost:8000/docs （Swagger UI）
- フロントエンド: http://localhost:3000 （Web画面）

---

## 6. トラブルシューティング

### ❌ `python: command not found` エラー

**原因**: PythonがPATHに追加されていない

**解決方法**:
1. Pythonを再インストールし、「Add Python to PATH」にチェックを入れる
2. または、環境変数を手動で設定する

### ❌ `Activate.ps1 cannot be loaded` エラー

**原因**: PowerShellの実行ポリシーが制限されている

**解決方法**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ `npm: command not found` エラー

**原因**: Node.jsがインストールされていない、またはPATHに追加されていない

**解決方法**:
1. Node.jsを再インストール
2. PowerShellを再起動

### ❌ ポート番号が既に使用されている

**エラー例**: `Address already in use`

**解決方法**:
1. 他のアプリケーションが同じポート（8000または3000）を使用していないか確認
2. 使用中のプロセスを終了するか、別のポートを使用する

### ❌ パッケージのインストールに失敗する

**解決方法**:

**Python（pip）の場合:**
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

**Node.js（npm）の場合:**
```powershell
npm cache clean --force
npm install
```

---

## 📚 次のステップ

環境構築が完了したら、以下のドキュメントを参照してください：

- **README.md**: プロジェクト全体の概要と機能説明
- **API仕様書**: http://localhost:8000/docs （バックエンド起動時）

---

## 💡 ヒント

### 開発を始める前に毎回やること

**バックエンド:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python run.py
```

**フロントエンド（別のウィンドウ）:**
```powershell
cd frontend
npm run dev
```

### 仮想環境を終了するには

```powershell
deactivate
```

---

## ❓ 質問・問題がある場合

- GitHubのIssuesで質問を投稿してください
- エラーメッセージをそのままコピーして検索すると、解決策が見つかることがあります

---

**🎉 セットアップ完了おめでとうございます！**
