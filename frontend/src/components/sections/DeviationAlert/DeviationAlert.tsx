"use client";

import { FC } from "react";
import {
  Alert,
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  LocalParking as ParkingIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { formatDateTime } from "@/lib/utils";
import type { DeviationAlert } from "@/lib/types";

type DeviationAlertProps = {
  alert: DeviationAlert;
  onMarkAsRelated?: () => void;
  onReturnToAgenda?: () => void;
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
  onMarkAsRelated,
  onReturnToAgenda,
  onAddToParkingLot,
  onDismiss,
}) => {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return "success";
    if (similarity >= 0.4) return "warning";
    return "error";
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.7) return "高";
    if (similarity >= 0.4) return "中";
    return "低";
  };

  const handleMarkAsRelated = () => {
    onMarkAsRelated?.();
  };

  const handleReturnToAgenda = () => {
    onReturnToAgenda?.();
  };

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              議題からの逸脱を検知
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {alert.message}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                類似度:
              </Typography>
              <Chip
                label={getSimilarityLabel(alert.similarity)}
                color={getSimilarityColor(alert.similarity)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                ({alert.similarity.toFixed(2)})
              </Typography>
            </Box>
          </Box>
          
          <Button
            size="small"
            onClick={handleDismiss}
            startIcon={<CloseIcon />}
          >
            無視
          </Button>
        </Box>

        {alert.suggestedTopics.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              戻す先の議題候補:
            </Typography>
            <List dense>
              {alert.suggestedTopics.map((topic, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={topic}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckIcon />}
            onClick={handleMarkAsRelated}
            sx={{ bgcolor: "#4caf50", "&:hover": { bgcolor: "#45a049" } }}
          >
            アジェンダに関連している
          </Button>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleReturnToAgenda}
            sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
          >
            軌道修正して議題に戻す
          </Button>
          
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

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          検知時刻: {formatDateTime(alert.created_at)}
        </Typography>
      </Box>
    </Alert>
  );
};

export default DeviationAlertComponent;
