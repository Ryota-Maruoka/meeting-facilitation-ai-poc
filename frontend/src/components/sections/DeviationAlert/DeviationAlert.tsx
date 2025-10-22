"use client";

import { FC } from "react";
import {
  Alert,
  Box,
  Typography,
  Button,
} from "@mui/material";
import {
  Warning as WarningIcon,
  LocalParking as ParkingIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { DeviationAlert } from "@/lib/types";

type DeviationAlertProps = {
  alert: DeviationAlert;
  onAddToParkingLot?: (topic: string) => void;
  onDismiss?: () => void;
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
}) => {
  const handleAddToParkingLot = () => {
    onAddToParkingLot?.(alert.message);
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

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
        {/* 検知した発話内容 */}
        {alert.recent_text && (
          <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>
            "{alert.recent_text}"
          </Typography>
        )}
        
        {/* アクションボタン（2つのみ） */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<ParkingIcon />}
            onClick={handleAddToParkingLot}
            sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#f57c00" } }}
          >
            保留事項に追加
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            onClick={handleDismiss}
          >
            無視
          </Button>
        </Box>
      </Box>
    </Alert>
  );
};

export default DeviationAlertComponent;
