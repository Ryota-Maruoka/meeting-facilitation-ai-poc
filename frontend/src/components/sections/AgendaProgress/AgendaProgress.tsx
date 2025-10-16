"use client";

import { FC } from "react";
import { Box, Typography, LinearProgress, Chip } from "@mui/material";
import { formatDuration } from "@/lib/utils";
import type { AgendaItem } from "@/lib/types";

type AgendaProgressProps = {
  agendaItems: AgendaItem[];
};

/**
 * セクションレベルコンポーネント: アジェンダ進捗
 * 
 * アジェンダ項目の進捗状況を視覚的に表示
 * 
 * @param props - コンポーネントのプロパティ
 * @returns アジェンダ進捗の JSX 要素
 */
const AgendaProgress: FC<AgendaProgressProps> = ({ agendaItems }) => {
  const getStatusColor = (status: AgendaItem["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "in_progress":
        return "primary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: AgendaItem["status"]) => {
    switch (status) {
      case "pending":
        return "未開始";
      case "in_progress":
        return "進行中";
      case "completed":
        return "完了";
      default:
        return "不明";
    }
  };

  const calculateProgress = (item: AgendaItem): number => {
    if (item.status === "completed") return 100;
    if (item.status === "in_progress") return 50; // 仮の値
    return 0;
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        アジェンダ進捗
      </Typography>
      
      {agendaItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          アジェンダが設定されていません
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {agendaItems.map((item, index) => (
            <Box key={item.id || index}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {index + 1}. {item.title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDuration(item.duration)}
                  </Typography>
                  <Chip
                    label={getStatusLabel(item.status)}
                    color={getStatusColor(item.status)}
                    size="small"
                  />
                </Box>
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={calculateProgress(item)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                  },
                }}
              />
              
              {item.expectedOutcome && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  期待成果: {item.expectedOutcome}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AgendaProgress;
