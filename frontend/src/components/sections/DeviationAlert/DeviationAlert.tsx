"use client";

import { FC, useState } from "react";
import {
  Alert,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Warning as WarningIcon,
  LocalParking as ParkingIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import type { DeviationAlert } from "@/lib/types";

const MAX_PREVIEW_LENGTH = 50;

type DeviationAlertProps = {
  alert: DeviationAlert;
  onAddToParkingLot?: (topic: string, addToNextAgenda: boolean) => void;
  onDismiss?: () => void;
  timestamp?: string;
  isLoading?: boolean;
};

/**
 * セクションレベルコンポーネント: 脱線アラート
 * 
 * 会議がアジェンダから逸脱した際のアラート表示と対応アクション
 * 
 * @param props - コンポーネントのプロパティ
 * @returns 脱線アラートの JSX 要素
 */
const DeviationAlertComponent: FC<DeviationAlertProps> = ({
  alert,
  onAddToParkingLot,
  onDismiss,
  timestamp,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddToParkingLot = () => {
    // タイトルなしでコンテンツのみ送信（バックエンドで自動生成）
    onAddToParkingLot?.(alert.recent_text, false);
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 表示テキストの決定（50文字以上の場合のみ省略）
  const displayText = isExpanded
    ? alert.recent_text
    : alert.recent_text.substring(0, MAX_PREVIEW_LENGTH);
  
  const shouldShowExpandButton = alert.recent_text.length > MAX_PREVIEW_LENGTH;

  return (
    <Alert
      severity="warning"
      icon={<WarningIcon />}
      sx={{
        "& .MuiAlert-message": {
          width: "100%",
        },
        mb: 2,
      }}
    >
      <Box>
        {/* タイムスタンプ表示（録音開始からの経過時間） */}
        {timestamp && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            {timestamp}
          </Typography>
        )}
        
        {/* 検知した発話内容 */}
        {alert.recent_text && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                mb: shouldShowExpandButton ? 1 : 0,
              }}
            >
              "{displayText}{!isExpanded && shouldShowExpandButton ? "..." : ""}"
            </Typography>
            {shouldShowExpandButton && (
              <Button
                size="small"
                onClick={toggleExpand}
                startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  minWidth: "auto",
                  padding: "4px 8px",
                }}
              >
                {isExpanded ? "閉じる" : "もっと見る"}
              </Button>
            )}
          </Box>
        )}
        
        {/* アクションボタン（2つのみ） */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={isLoading ? <CircularProgress size={16} /> : <ParkingIcon />}
            onClick={handleAddToParkingLot}
            disabled={isLoading}
            sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#f57c00" } }}
          >
            {isLoading ? "保留事項に追加中..." : "保留事項に追加"}
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            onClick={handleDismiss}
            disabled={isLoading}
          >
            無視
          </Button>
        </Box>
      </Box>
    </Alert>
  );
};

export default DeviationAlertComponent;
