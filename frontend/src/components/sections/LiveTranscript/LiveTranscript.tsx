"use client";

import { FC, useEffect, useRef } from "react";
import { Box, Typography, Chip, Divider } from "@mui/material";
import { formatDateTime } from "@/lib/utils";
import type { Transcript } from "@/lib/types";

type LiveTranscriptProps = {
  transcripts: Transcript[];
};

/**
 * セクションレベルコンポーネント: ライブ字幕
 * 
 * リアルタイムの文字起こし結果を表示
 * 
 * @param props - コンポーネントのプロパティ
 * @returns ライブ字幕の JSX 要素
 */
const LiveTranscript: FC<LiveTranscriptProps> = ({ transcripts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しい文字起こしが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "default";
    if (confidence >= 0.8) return "success";
    if (confidence >= 0.6) return "warning";
    return "error";
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return "不明";
    if (confidence >= 0.8) return "高";
    if (confidence >= 0.6) return "中";
    return "低";
  };

  return (
    <Box
      ref={scrollRef}
      sx={{
        height: 300,
        overflowY: "auto",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
        bgcolor: "background.paper",
      }}
    >
      {transcripts.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            文字起こし結果がありません
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            録音を開始すると、ここにリアルタイムで文字起こしが表示されます
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {transcripts.map((transcript, index) => (
            <Box key={transcript.id || index}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, mt: 0.5 }}>
                  {formatTimestamp(transcript.timestamp)}
                </Typography>
                
                <Box sx={{ flexGrow: 1 }}>
                  {transcript.speaker && (
                    <Chip
                      label={transcript.speaker}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 0.5, fontSize: "0.7rem" }}
                    />
                  )}
                  
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {transcript.text}
                  </Typography>
                  
                  {transcript.confidence !== undefined && (
                    <Chip
                      label={`信頼度: ${getConfidenceLabel(transcript.confidence)}`}
                      size="small"
                      color={getConfidenceColor(transcript.confidence)}
                      sx={{ mt: 0.5, fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
              </Box>
              
              {index < transcripts.length - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default LiveTranscript;
