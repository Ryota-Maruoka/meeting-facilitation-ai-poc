# 🆓 無料ASR実装ガイド

完全無料で音声認識機能を実装する方法を説明します。

## 🎯 無料ASRオプション

### 1. **Whisper.cpp**（推奨）
- **コスト**: 完全無料
- **精度**: 高（OpenAI Whisperと同等）
- **速度**: 中（ローカル実行）
- **セットアップ**: 簡単

### 2. **ブラウザのWeb Speech API**
- **コスト**: 完全無料
- **精度**: 中（ブラウザ依存）
- **速度**: 速（リアルタイム）
- **セットアップ**: フロントエンド実装

### 3. **スタブ実装**
- **コスト**: 完全無料
- **精度**: なし（開発用）
- **速度**: 速
- **セットアップ**: 不要

## 🚀 クイックスタート

### 自動セットアップ（推奨）

```bash
# バックエンドディレクトリで実行
cd backend
python setup_free_asr.py
```

### 手動セットアップ

#### 1. Whisper.cppのセットアップ

```bash
# 1. Whisper.cppをダウンロード
# https://github.com/ggerganov/whisper.cpp/releases
# whisper-bin-x64.zip をダウンロード

# 2. 展開
unzip whisper-bin-x64.zip
mv whisper-cpp whisper-cpp

# 3. モデルファイルをダウンロード
cd whisper-cpp
mkdir models
cd models
# ggml-base.bin をダウンロード（約1.5GB）
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# 4. 環境変数を設定
echo "WHISPER_EXECUTABLE_PATH=./whisper-cpp/whisper.exe" > .env
echo "WHISPER_MODEL_PATH=./whisper-cpp/models/ggml-base.bin" >> .env
echo "ASR_LANGUAGE=ja" >> .env
```

#### 2. テスト実行

```bash
# バックエンドサーバーを起動
python run.py

# 別のターミナルでテスト
curl -X POST "http://localhost:8000/meetings/{meeting_id}/transcribe" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test_audio.wav"
```

## 🔧 設定オプション

### 環境変数

```bash
# .env ファイル
ASR_PROVIDER=whisper_cpp          # whisper_cpp, browser_api, stub
WHISPER_EXECUTABLE_PATH=./whisper-cpp/whisper.exe
WHISPER_MODEL_PATH=./whisper-cpp/models/ggml-base.bin
ASR_LANGUAGE=ja                   # ja, en, auto
ASR_TEMPERATURE=0.0               # 0.0-1.0
```

### モデル選択

| モデル | サイズ | 精度 | 速度 | 用途 |
|--------|--------|------|------|------|
| tiny | 39MB | 低 | 速 | 開発・テスト |
| base | 142MB | 中 | 中 | 一般用途 |
| small | 466MB | 高 | 遅 | 高精度 |
| medium | 1.5GB | 高 | 遅 | 最高精度 |

## 🌐 ブラウザAPI実装

フロントエンドでWeb Speech APIを使用する場合：

```javascript
// フロントエンド実装例
const recognition = new webkitSpeechRecognition();
recognition.lang = 'ja-JP';
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  // バックエンドに送信
  sendTranscript(transcript);
};

recognition.start();
```

## 📊 パフォーマンス比較

| 方式 | コスト | 精度 | 速度 | プライバシー | セットアップ |
|------|--------|------|------|------------|------------|
| Whisper.cpp | 無料 | 高 | 中 | ローカル | 簡単 |
| Web Speech API | 無料 | 中 | 速 | ブラウザ | 中 |
| スタブ | 無料 | なし | 速 | ローカル | 不要 |

## 🛠️ トラブルシューティング

### Whisper.cpp

**エラー**: `FileNotFoundError: Whisper.cpp not found`
```bash
# 解決方法
export WHISPER_EXECUTABLE_PATH=/path/to/whisper.exe
```

**エラー**: `Model file not found`
```bash
# 解決方法
export WHISPER_MODEL_PATH=/path/to/ggml-base.bin
```

**エラー**: `subprocess.TimeoutExpired`
```bash
# 解決方法: より小さなモデルを使用
# tinyモデル（39MB）を試す
```

### ブラウザAPI

**エラー**: `webkitSpeechRecognition is not defined`
```javascript
// 解決方法: HTTPS環境で実行
// またはChrome/Edgeブラウザを使用
```

## 🚀 本番環境での推奨設定

### 開発環境
- **推奨**: スタブ実装
- **理由**: セットアップ不要、高速

### テスト環境
- **推奨**: Whisper.cpp (tiny model)
- **理由**: 軽量、高速、無料

### 本番環境
- **推奨**: Whisper.cpp (base model)
- **理由**: 高精度、無料、プライバシー保護

## 📝 実装例

### バックエンド（Python）

```python
from app.services.free_asr import transcribe_audio

# 音声ファイルを文字起こし
with open("audio.wav", "rb") as f:
    audio_data = f.read()

chunks = transcribe_audio(audio_data)
for chunk in chunks:
    print(f"{chunk['start_sec']:.1f}s: {chunk['text']}")
```

### フロントエンド（JavaScript）

```javascript
// 音声録音
const mediaRecorder = new MediaRecorder(stream);
const audioChunks = [];

mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};

mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  
  // バックエンドに送信
  const formData = new FormData();
  formData.append('file', audioBlob);
  
  fetch('/meetings/123/transcribe', {
    method: 'POST',
    body: formData
  });
};
```

## 🎉 完了！

これで完全無料の音声認識機能が実装できました！

- ✅ コスト: 0円
- ✅ プライバシー: ローカル処理
- ✅ 精度: 高（Whisper.cpp使用時）
- ✅ セットアップ: 自動化済み
