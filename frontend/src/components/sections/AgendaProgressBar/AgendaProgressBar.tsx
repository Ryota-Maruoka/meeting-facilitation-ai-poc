"use client";

import { FC } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
} from "@mui/material";
import type { AgendaItem } from "@/lib/types";

type AgendaProgressBarProps = {
  agenda: AgendaItem[];
  currentIndex: number;
};

/**
 * セクションレベルコンポーネント: アジェンダ進捗バー
 * 
 * 会議のアジェンダ進行状況を視覚的に表示
 */
const AgendaProgressBar: FC<AgendaProgressBarProps> = ({
  agenda,
  currentIndex,
}) => {
  if (!agenda || agenda.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          アジェンダが設定されていません
        </Typography>
      </Box>
    );
  }

  const getProgressValue = (index: number) => {
    if (index < currentIndex) return 100; // 完了
    if (index === currentIndex) return 50; // 進行中（仮）
    return 0; // 未開始
  };

  const getStatusColor = (index: number) => {
    if (index < currentIndex) return "success";
    if (index === currentIndex) return "primary";
    return "default";
  };

  const getStatusLabel = (index: number) => {
    if (index < currentIndex) return "完了";
    if (index === currentIndex) return "進行中";
    return "待機中";
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        アジェンダ進捗
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {agenda.map((item, index) => (
          <Box key={item.id || index} sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {index + 1}. {item.title}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={getStatusLabel(index)}
                  color={getStatusColor(index)}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {item.duration}分
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={getProgressValue(index)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                },
              }}
            />
            
            {item.expectedOutcome && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, fontSize: "0.75rem" }}
              >
                期待成果: {item.expectedOutcome}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      
      {/* 合計時間表示 */}
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Typography variant="body2" color="text.secondary">
          合計時間: {agenda.reduce((total, item) => total + item.duration, 0)}分
        </Typography>
      </Box>
    </Box>
  );
};

export default AgendaProgressBar;
