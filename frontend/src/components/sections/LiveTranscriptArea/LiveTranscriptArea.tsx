"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { apiClient } from "@/lib/api";
import { formatElapsedHMSFromMs } from "@/lib/time";
import type { Transcript } from "@/lib/types";

type LiveTranscriptAreaProps = {
  meetingId: string;
  onTranscriptsUpdate?: (transcripts: Transcript[]) => void;
  autoStart?: boolean;
};

export type LiveTranscriptAreaHandle = {
  stopAndFlush: () => Promise<void>;
};

type TranscriptItem = {
  id: string;
  timestamp: string;
  text: string;
  speaker?: string;
};

/**
 * セクションレベルコンポーネント: ライブ字幕表示エリア
 * 
 * 音声録音とリアルタイム文字起こし結果を表示
 * 録音状態を内部で管理し、自動録音にも対応
 */
const LiveTranscriptArea = forwardRef<LiveTranscriptAreaHandle, LiveTranscriptAreaProps>(({ 
  meetingId,
  onTranscriptsUpdate,
  autoStart = false,
}, ref) => {
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
  const stopResolveRef = useRef<(() => void) | null>(null);
  const finalStopRequestedRef = useRef<boolean>(false);
  const isFirstChunkRef = useRef<boolean>(true); // 最初のチャンクかどうかを追跡
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null); // 録音インターバルの参照

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
      
      // ファイルサイズのチェック（無音データの事前除外）
      // WebM形式では、正常な10秒の音声データは約10-30KB程度
      // 無音データは1-3KB程度になる
      // より厳密な判定はバックエンド側で行う（音声の長さとファイルサイズの比率を計算）
      const MIN_AUDIO_SIZE = 5 * 1024; // 5KB（正常な10秒の音声データの下限）
      if (audioBlob.size < MIN_AUDIO_SIZE) {
        console.warn("⚠️ 音声データが小さすぎます（無音の可能性、送信をスキップ）:", audioBlob.size, "bytes");
        // エラーを表示せず、静かに無視（ユーザーには影響なし）
        setIsProcessing(false);
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
        const timestamp = formatElapsedHMSFromMs(now - startTimeRef.current);
        
        // WhisperのJSONからタイムスタンプ情報を除去し、テキストのみを抽出
        const cleanText = result.text
          .replace(/\[\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*[-–>→]+\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*\]/g, '') // 通常パターン [00:00:00.000 --> 00:00:02.000]
          .replace(/\[[\d:\.\-\s>→]+\]/g, '')
          .replace(/\s+/g, ' ') // 余分な空白を単一スペースに統一
          .trim();
        
        // テキストが空になった場合は無視
        if (!cleanText) {
          console.warn("⚠️ クリーンアップ後のテキストが空です");
          setIsProcessing(false);
          return;
        }
        
        // テキスト内容の妥当性チェック（最小限：明らかに不正なパターンのみ）
        // 日本語の割合が極端に低い場合（20%未満）のみ除外
        const japaneseCharPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g;
        const japaneseMatches = cleanText.match(japaneseCharPattern);
        const japaneseCount = japaneseMatches ? japaneseMatches.length : 0;
        const totalCharCount = cleanText.replace(/\s/g, '').length;
        const japaneseRatio = totalCharCount > 0 ? japaneseCount / totalCharCount : 0;
        
        if (totalCharCount > 5 && japaneseRatio < 0.2) {
          console.warn("⚠️ 日本語の割合が低すぎます（無視）:", {
            ratio: `${(japaneseRatio * 100).toFixed(1)}%`,
            text: cleanText.substring(0, 50),
          });
          setIsProcessing(false);
          return;
        }
        
        const hallucinationPatterns = [
          /ご視聴.*?ありがとう/,
          /Thanks?\s+for\s+watching/i,
          /让我们来看看/,
          /視聴.*?感謝/,
          /ご.*?視聴.*?ございました/,
        ];
        
        for (const pattern of hallucinationPatterns) {
          if (pattern.test(cleanText)) {
            console.warn("⚠️ 幻聴パターンを検出（無視）:", cleanText.substring(0, 50));
            setIsProcessing(false);
            return;
          }
        }
        
            const newTranscript: TranscriptItem = {
              id: result.id || `transcript-${now}`,
              timestamp, // リアルタイムの経過時間のみ使用
              text: cleanText,
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
      // マイクアクセスを要求
      console.log("🎤 マイクアクセスを要求中...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Whisper推奨サンプルレート
          channelCount: 1,   // モノラル
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      console.log("✅ マイクアクセス成功");
      console.log("🎧 オーディオトラック情報:", stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        settings: track.getSettings()
      })));

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
          
          // チャンクを蓄積
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
      
      // 録音停止時の処理
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
          
          // 最初のチャンク送信完了後、30秒間隔に切り替え
          const wasFirstChunk = isFirstChunkRef.current;
          if (wasFirstChunk) {
            console.log("✅ 最初のチャンク送信完了、以降は30秒間隔に切り替え");
            isFirstChunkRef.current = false;
          }
          
          // stopAndFlush（最終停止）要求時のみデバイスを停止し、待機を解放
          if (finalStopRequestedRef.current) {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            if (stopResolveRef.current) {
              stopResolveRef.current();
              stopResolveRef.current = null;
            }
            finalStopRequestedRef.current = false; // リセット
          } else {
            // 通常のサイクル継続の場合、次の録音を開始
            if (mediaRecorderRef.current && streamRef.current) {
              // 最初のチャンク後は常に30秒間隔で継続
              const nextTimeslice = 30000;
              setTimeout(() => {
                if (finalStopRequestedRef.current) return;
                if (mediaRecorderRef.current && streamRef.current) {
                  mediaRecorderRef.current.start(nextTimeslice);
                  // 次のサイクルをスケジュール
                  scheduleNextRecording();
                }
              }, 120);
            }
          }
        } else {
          // チャンクが空の場合でも、停止要求の処理は実行
          if (finalStopRequestedRef.current) {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            if (stopResolveRef.current) {
              stopResolveRef.current();
              stopResolveRef.current = null;
            }
            finalStopRequestedRef.current = false;
          }
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("🎧 MediaRecorder エラー:", e);
        setError("録音中にエラーが発生しました");
      };

      // 最初のチャンクフラグをリセット
      isFirstChunkRef.current = true;

      // ✅ 最初の3秒で即座にチャンクを送信（最初の数秒間の音声を確実に取得）
      // その後は30秒間隔に切り替える
      console.log("🎙️ 録音開始：最初のチャンクは3秒後に送信");
      mediaRecorder.start(3000); // 最初は3秒間隔

      // ✅ 録音サイクルを管理する関数（onstopから呼ばれる）
      const scheduleNextRecording = () => {
        if (finalStopRequestedRef.current) {
          return;
        }
        
        if (mediaRecorderRef.current && streamRef.current) {
          const isFirstChunk = isFirstChunkRef.current;
          const nextInterval = isFirstChunk ? 3000 : 30000;
          
          // 次のサイクルをスケジュール
          recordingIntervalRef.current = setTimeout(() => {
            if (finalStopRequestedRef.current) {
              return;
            }
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              const intervalLabel = isFirstChunk ? "3秒" : "30秒";
              console.log(`🔄 ${intervalLabel}経過：録音を停止→再開`);
              mediaRecorderRef.current.stop();
              // onstopで自動的に次のサイクルが開始される
            }
          }, nextInterval);
        }
      };
      
      // 最初のサイクルをスケジュール（3秒後に最初のチャンクを送信）
      scheduleNextRecording();
      
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
    // 録音サイクルのタイマーをクリア
    if (recordingIntervalRef.current) {
      clearTimeout(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // 古いインターバル方式のクリア（後方互換性）
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).recordingIntervalId) {
      clearInterval((mediaRecorderRef.current as any).recordingIntervalId);
      (mediaRecorderRef.current as any).recordingIntervalId = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  }, []);

  // 親コンポーネントから呼び出す: 録音停止し、最後の送信・文字起こし完了まで待機
  useImperativeHandle(ref, () => ({
    stopAndFlush: async () => {
      if (!mediaRecorderRef.current || (mediaRecorderRef.current.state !== "recording")) {
        return; // 既に停止済み
      }
      await new Promise<void>((resolve) => {
        stopResolveRef.current = resolve;
        finalStopRequestedRef.current = true;
        // stopRecording 内で MediaRecorder.stop() を呼ぶ
        stopRecording();
      });
    },
  }), [stopRecording]);

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
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: "none", borderRadius: 0 }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", p: 2, "&:last-child": { pb: 2 } }}>
      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 字幕表示エリア */}
      <Paper
        data-transcript-container
        sx={{
          flexGrow: 1,
          p: 2,
          pb: 3,
          backgroundColor: "grey.50",
          overflow: "auto",
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
                  {isRecording ? "音声を認識中..." : "録音を開始してください"}
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

      {/* 処理中表示 */}
      {isProcessing && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2, mt: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            文字起こし処理中...
          </Typography>
        </Box>
      )}
      </CardContent>
    </Card>
  );
});

export default LiveTranscriptArea;
