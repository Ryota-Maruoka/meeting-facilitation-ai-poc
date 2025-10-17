# 開発者向けセットアップガイド

## 概要

このドキュメントは、Meeting Facilitation AI PoCの開発に参加する開発者向けの詳細なセットアップ手順です。

## 前提条件

- Python 3.11以上
- Node.js 18以上
- Git

## バックエンドセットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd meeting-facilitation-ai-poc/backend
```

### 2. 仮想環境の作成と有効化

```bash
# 仮想環境作成
python -m venv .venv

# 仮想環境有効化（Windows）
.\.venv\Scripts\Activate.ps1

# 仮想環境有効化（macOS/Linux）
source .venv/bin/activate
```

### 3. 依存関係のインストール

```bash
pip install -r requirements.txt
```

**重要**: `openai-whisper`パッケージは初回インストール時に大きなモデルファイル（数GB）をダウンロードします。

### 4. 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください。

### 5. 開発サーバーの起動

```bash
python run.py
```

## 依存関係の管理

### 新しいパッケージの追加

1. `requirements.txt`にパッケージを追加
2. バージョンを固定（例: `package==1.2.3`）
3. 変更をコミット

```bash
# 例: 新しいパッケージを追加
echo "new-package==1.2.3" >> requirements.txt
pip install -r requirements.txt
git add requirements.txt
git commit -m "Add new-package dependency"
```

### パッケージの更新

```bash
# 特定のパッケージを更新
pip install --upgrade package-name

# requirements.txtを更新
pip freeze > requirements.txt
```

## 開発時の注意事項

### Whisper関連

- **Whisper.cpp**を使用（`main.exe` + `ggml-base.bin`モデル）
- 実行ファイルとモデルファイルは手動ダウンロードが必要
- ローカル実行、無料、軽量

### テスト実行

```bash
# API接続テスト
python test_api.py

# Whisper動作テスト
python test_whisper.py
```

### コード品質

- コードフォーマット: `black .`
- リンター: `ruff check .`
- 型チェック: `mypy .`

## トラブルシューティング

### よくある問題

1. **`main.exe`が見つからないエラー**
   ```bash
   # Whisper.cppの実行ファイルをダウンロード
   # https://github.com/ggerganov/whisper.cpp/releases
   ```

2. **仮想環境が認識されない**
   ```bash
   # 仮想環境を再作成
   rm -rf .venv
   python -m venv .venv
   source .venv/bin/activate  # または .\.venv\Scripts\Activate.ps1
   ```

3. **パッケージの競合**
   ```bash
   # 仮想環境をクリーンアップ
   pip freeze > temp_requirements.txt
   pip uninstall -y -r temp_requirements.txt
   pip install -r requirements.txt
   rm temp_requirements.txt
   ```

## 貢献ガイドライン

1. 新しい機能を追加する前に、既存のコードを確認
2. 適切なテストを追加
3. ドキュメントを更新
4. プルリクエストを作成

## 参考資料

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [Pydantic v2](https://docs.pydantic.dev/2.0/)
