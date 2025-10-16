# ASR（音声認識）セットアップガイド

このガイドでは、Meeting Facilitation AI PoCでASR機能を設定する方法を説明します。

## 🎯 選択肢

### 1. OpenAI Whisper API（推奨）
- **メリット**: 簡単、高精度、クラウドベース
- **デメリット**: API料金、インターネット必須
- **料金**: $0.006/分（約0.9円/分）

### 2. Whisper.cpp（ローカル実行）
- **メリット**: 無料、プライバシー保護、オフライン
- **デメリット**: セットアップ複雑、リソース使用量大
- **必要**: 4GB以上のRAM、モデルファイル（約1.5GB）

## 🔧 セットアップ方法

### オプション1: OpenAI Whisper API

1. **OpenAI APIキーを取得**
   ```bash
   # https://platform.openai.com/api-keys でAPIキーを取得
   ```

2. **環境変数を設定**
   ```bash
   # backend/env.example を .env にコピー
   cp env.example .env
   
   # .env ファイルを編集
   ASR_PROVIDER=openai_whisper
   OPENAI_API_KEY=your_actual_api_key_here
   ASR_LANGUAGE=ja
   ASR_TEMPERATURE=0.0
   ```

3. **依存関係をインストール**
   ```bash
   pip install httpx
   ```

4. **テスト実行**
   ```bash
   python run.py
   # http://localhost:8000/docs でAPIをテスト
   ```

### オプション2: Whisper.cpp

1. **Whisper.cppをビルド**
   ```bash
   # Whisper.cppリポジトリをクローン
   git clone https://github.com/ggerganov/whisper.cpp.git
   cd whisper.cpp
   
   # ビルド（Windows）
   # Visual Studio 2019/2022が必要
   mkdir build
   cd build
   cmake ..
   cmake --build . --config Release
   
   # 実行ファイルのパスをメモ
   # 例: C:\path\to\whisper.cpp\build\bin\Release\whisper.exe
   ```

2. **モデルファイルをダウンロード**
   ```bash
   # モデルディレクトリを作成
   mkdir models
   cd models
   
   # ベースモデルをダウンロード（約1.5GB）
   # https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
   wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
   ```

3. **環境変数を設定**
   ```bash
   # backend/env.example を .env にコピー
   cp env.example .env
   
   # .env ファイルを編集
   ASR_PROVIDER=whisper_cpp
   WHISPER_MODEL_PATH=C:\path\to\whisper.cpp\models\ggml-base.bin
   WHISPER_EXECUTABLE_PATH=C:\path\to\whisper.cpp\build\bin\Release\whisper.exe
   ASR_LANGUAGE=ja
   ASR_TEMPERATURE=0.0
   ```

4. **テスト実行**
   ```bash
   python run.py
   # http://localhost:8000/docs でAPIをテスト
   ```

## 🧪 テスト方法

### API経由でテスト

1. **音声ファイルをアップロード**
   ```bash
   curl -X POST "http://localhost:8000/meetings/{meeting_id}/transcribe" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@test_audio.wav"
   ```

2. **文字起こし結果を確認**
   ```bash
   curl "http://localhost:8000/meetings/{meeting_id}/transcripts"
   ```

### 音声ファイルの要件

- **フォーマット**: WAV, MP3, M4A, FLAC
- **サンプリングレート**: 16kHz以上
- **チャンネル**: モノラル推奨
- **長さ**: 最大25MB（OpenAI Whisper API）

## 🔧 トラブルシューティング

### OpenAI Whisper API

**エラー**: `401 Unauthorized`
- **原因**: APIキーが無効
- **解決**: 正しいAPIキーを設定

**エラー**: `429 Too Many Requests`
- **原因**: レート制限
- **解決**: しばらく待ってから再試行

### Whisper.cpp

**エラー**: `FileNotFoundError: Model file not found`
- **原因**: モデルファイルのパスが間違っている
- **解決**: `WHISPER_MODEL_PATH`を正しいパスに設定

**エラー**: `FileNotFoundError: Whisper.cpp executable not found`
- **原因**: 実行ファイルのパスが間違っている
- **解決**: `WHISPER_EXECUTABLE_PATH`を正しいパスに設定

**エラー**: `subprocess.TimeoutExpired`
- **原因**: 処理時間が長すぎる
- **解決**: より小さなモデルを使用するか、音声ファイルを短くする

## 📊 パフォーマンス比較

| 方式 | 精度 | 速度 | コスト | プライバシー |
|------|------|------|--------|------------|
| OpenAI Whisper API | 高 | 速 | 有料 | クラウド |
| Whisper.cpp (base) | 高 | 中 | 無料 | ローカル |
| Whisper.cpp (tiny) | 中 | 速 | 無料 | ローカル |

## 🚀 本番環境での推奨設定

### 開発環境
- **推奨**: OpenAI Whisper API
- **理由**: セットアップが簡単、高精度

### 本番環境
- **推奨**: Whisper.cpp (base model)
- **理由**: コスト削減、プライバシー保護

### ハイブリッド
- **推奨**: 開発時はAPI、本番時はローカル
- **理由**: 柔軟性とコスト効率の両立
