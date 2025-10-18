"use client";

import { FC, useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { apiClient } from "@/lib/api";
import type { Transcript } from "@/lib/types";

type LiveTranscriptAreaProps = {
  meetingId: string;
  onTranscriptsUpdate?: (transcripts: Transcript[]) => void;
  autoStart?: boolean; // 自動的に録音を開始するかどうか
};

type TranscriptItem = {
  id: string;
  timestamp: string;
  text: string;
  speaker?: string;
  confidence?: number;
};

/**
 * セクションレベルコンポーネント: ライブ字幕表示エリア
 * 
 * 音声録音とリアルタイム文字起こし結果を表示
 * 録音状態を内部で管理し、自動録音にも対応
 */
const LiveTranscriptArea: FC<LiveTranscriptAreaProps> = ({
  meetingId,
  onTranscriptsUpdate,
  autoStart = false,
}) => {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // 音声録音関連のref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // ブラウザの対応状況をチェック
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError("このブラウザは音声録音をサポートしていません");
    }
  }, []);

  // autoStartがtrueになったら自動的に録音を開始
  useEffect(() => {
    if (autoStart && !isRecording && isSupported) {
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // 音声チャンクを送信する関数
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      console.log("🎤 音声チャンク送信開始:", {
        size: audioBlob.size,
        type: audioBlob.type,
        meetingId
      });
      
      setIsProcessing(true);
      
      // ファイルサイズのチェック
      if (audioBlob.size < 1000) {
        console.warn("⚠️ 音声データが小さすぎます:", audioBlob.size);
        setError("音声データが小さすぎます");
        return;
      }
      
      if (audioBlob.size > 50 * 1024 * 1024) { // 50MB制限
        console.warn("⚠️ 音声ファイルが大きすぎます:", audioBlob.size);
        setError("音声ファイルが大きすぎます（50MB以下）");
        return;
      }
      
      // WebMファイルをFileオブジェクトに変換
      const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
      console.log("📁 ファイル作成完了:", audioFile.name, audioFile.size);
      
      // 実際のAPIエンドポイントに送信
      console.log("🚀 API送信開始...");
      const result = await apiClient.transcribeAudio(meetingId, audioFile);
      console.log("✅ API送信成功:", result);
      
      if (result.text) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        
        // WhisperのJSONからタイムスタンプ情報を除去し、テキストのみを抽出
        // 包括的なタイムスタンプ除去パターンに対応
        const cleanText = result.text
          .replace(/\[\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*[-–>→]+\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*\]/g, '') // 通常パターン [00:00:00.000 --> 00:00:02.000]
          .replace(/\[[\d:\.\-\s>→]+\]/g, '') // 念のため追加（Whisperの変形出力にも対応）
          .replace(/\s+/g, ' ') // 余分な空白を単一スペースに統一
          .trim();
        
        const newTranscript: TranscriptItem = {
          id: result.id || `transcript-${now}`,
          timestamp, // リアルタイムの経過時間のみ使用
          text: cleanText, // Whisperのタイムスタンプを除去したテキスト
          confidence: result.confidence,
        };
        
        console.log("📝 新しい文字起こし結果:", newTranscript);
        setTranscripts(prev => {
          const updated = [...prev, newTranscript];
          // 最新の結果を画面の上部に表示するため、自動スクロール
          setTimeout(() => {
            const container = document.querySelector('[data-transcript-container]');
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 100);
          
          // 親コンポーネントに文字起こし結果を通知（Transcript型に変換）
          if (onTranscriptsUpdate) {
            const transcriptData: Transcript[] = updated.map(t => ({
              id: t.id,
              meetingId,
              timestamp: t.timestamp,
              text: t.text,
              speaker: t.speaker,
            }));
            // レンダリング中にsetStateを呼び出さないよう、非同期で実行
            setTimeout(() => {
              onTranscriptsUpdate(transcriptData);
            }, 0);
          }
          
          return updated;
        });
      } else {
        console.warn("⚠️ 文字起こし結果が空です");
      }
    } catch (err) {
      console.error("❌ 音声送信エラー:", err);
      if (err instanceof Error) {
        setError(`音声の送信に失敗しました: ${err.message}`);
      } else {
        setError("音声の送信に失敗しました");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [meetingId]);

  // 録音開始
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      // 録音開始時は文字起こし結果をクリアしない（既存の結果を保持）
      
      // マイクアクセスを要求
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Whisper推奨サンプルレート
          channelCount: 1,   // モノラル
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      streamRef.current = stream;
      startTimeRef.current = Date.now();
      
      // ブラウザがサポートするMIMEタイプを検出
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      
      let selectedMimeType = "audio/webm"; // デフォルト
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log("✅ 使用するMIMEタイプ:", mimeType);
          break;
        }
      }
      
      // MediaRecorderを設定
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // ✅ チャンクを蓄積して完全なWebMファイルを作成
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log("🎵 音声チャンク受信:", event.data.size, "bytes", event.data.type);
          
          // チャンクを蓄積（完全なWebMファイルを作成するため）
          audioChunksRef.current.push(event.data);
          
          // データの先頭バイトをログ出力（デバッグ用）
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer).slice(0, 20);
            console.log("📊 音声データの先頭バイト:", Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
          };
          reader.readAsArrayBuffer(event.data.slice(0, 20));
        }
      };
      
      // 録音停止時の処理（完全なWebMファイルを送信）
      mediaRecorder.onstop = async () => {
        console.log("🛑 録音停止");
        
        if (audioChunksRef.current.length > 0) {
          // すべてのチャンクを結合して完全なWebMファイルを作成
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          console.log("📦 完全な音声ファイル作成:", audioBlob.size, "bytes");
          
          // 文字起こしを実行
          try {
            await sendAudioChunk(audioBlob);
          } catch (err) {
            console.error("❌ 音声送信エラー:", err);
          }
          
          // チャンクをクリア（次の周期の準備）
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("🎧 MediaRecorder エラー:", e);
        setError("録音中にエラーが発生しました");
      };

      // ✅ 10秒ごとに ondataavailable が自動で発火
      mediaRecorder.start(10000);
      
      // ✅ 10秒ごとに録音を停止→再開（完全なWebMファイルを生成するため）
      const recordingInterval = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("🔄 10秒経過：録音を停止→再開");
          mediaRecorderRef.current.stop();
          
          // 少し待ってから再開（ondataavailableの完了を待つ）
          setTimeout(() => {
            if (mediaRecorderRef.current && streamRef.current) {
              audioChunksRef.current = []; // チャンクをクリア
              mediaRecorderRef.current.start(10000);
            }
          }, 100);
        }
      }, 10000); // 10秒ごと
      
      // インターバルIDを保存（停止時にクリアするため）
      (mediaRecorderRef.current as any).recordingIntervalId = recordingInterval;
      
      setIsRecording(true);
    } catch (err) {
      console.error("録音開始エラー:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
        } else if (err.name === "NotFoundError") {
          setError("マイクが見つかりません。マイクが接続されているか確認してください。");
        } else {
          setError(`録音開始エラー: ${err.message}`);
        }
      } else {
        setError("録音開始に失敗しました");
      }
    }
  }, [sendAudioChunk]);

  // 録音停止
  const stopRecording = useCallback(() => {
    // インターバルをクリア
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).recordingIntervalId) {
      clearInterval((mediaRecorderRef.current as any).recordingIntervalId);
      (mediaRecorderRef.current as any).recordingIntervalId = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  // 文字起こし結果をクリア
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setError(null);
    // 親コンポーネントにも空の配列を通知
    if (onTranscriptsUpdate) {
      onTranscriptsUpdate([]);
    }
  }, [onTranscriptsUpdate]);

  // コンポーネントのクリーンアップ時に録音を停止
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ブラウザサポート状況の確認
  if (!isSupported) {
    return (
      <Card sx={{ height: "500px" }}>
        <CardContent>
          <Alert severity="error">
            このブラウザは音声録音をサポートしていません。Chrome、Firefox、Safariの最新版をご利用ください。
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "500px" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}> */}
          {/* クリアボタン（一時的にコメントアウト） */}
          {/* {transcripts.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearTranscripts}
              disabled={isRecording || isProcessing}
              sx={{ minWidth: "auto" }}
            >
              クリア
            </Button>
          )} */}
        {/* </Box> */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      {/* 録音コントロール */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, justifyContent: "center", alignItems: "center" }}>
        {!isRecording ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<MicIcon />}
            onClick={startRecording}
            size="large"
            disabled={isProcessing}
          >
            録音開始
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              size="large"
              disabled={isProcessing}
            >
              録音停止
            </Button>
            
            {/* 録音中インジケーター */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "error.main",
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.3 },
                  },
                }}
              />
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                録音中（10秒ごとに文字起こし）
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 処理中表示 */}
      {isProcessing && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            文字起こし処理中...
          </Typography>
        </Box>
      )}

      {/* 字幕表示エリア */}
      <Paper
        data-transcript-container
        sx={{
          flexGrow: 1,
          p: 2,
          backgroundColor: "grey.50",
          overflow: "auto",
          maxHeight: "400px",
        }}
      >
        {transcripts.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
              }}
            >
              <Box>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {isRecording ? "🎤 音声を認識中... 10秒ごとに文字起こしされます" : "録音を開始してください"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  音声が文字起こしされてここに表示されます
                </Typography>
              </Box>
            </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {transcripts.map((transcript) => (
              <ListItem
                key={transcript.id}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  py: 1.5,
                  "&:last-child": {
                    borderBottom: 0,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{
                          fontWeight: 600,
                          minWidth: "40px",
                        }}
                      >
                        {transcript.timestamp}
                      </Typography>
                      {transcript.speaker && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            backgroundColor: "primary.light",
                            color: "primary.contrastText",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: "0.7rem",
                          }}
                        >
                          {transcript.speaker}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                      {transcript.text}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* 録音状態表示 */}
      {isRecording && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "error.main",
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 },
              },
            }}
          />
          <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
            録音中
          </Typography>
        </Box>
      )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LiveTranscriptArea;
