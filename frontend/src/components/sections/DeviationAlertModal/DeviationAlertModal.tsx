"use client";

import { FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import type { DeviationAlert } from "@/lib/types";

type DeviationAlertModalProps = {
  open: boolean;
  alert: DeviationAlert | null;
  onClose: () => void;
  onReturnToAgenda: (agenda: string) => void;
  onAddToParkingLot: (topic: string) => void;
  onIgnore: () => void;
};

/**
 * 脱線検知アラートモーダル
 *
 * 会議がアジェンダから逸脱した際に表示されるアラートモーダル
 * ユーザーは軌道修正、Parking Lot追加、無視のいずれかを選択できる
 */
const DeviationAlertModal: FC<DeviationAlertModalProps> = ({
  open,
  alert,
  onClose,
  onReturnToAgenda,
  onAddToParkingLot,
  onIgnore,
}) => {
  if (!alert) return null;

  const handleReturnToAgenda = (agenda: string) => {
    onReturnToAgenda(agenda);
    onClose();
  };

  const handleAddToParkingLot = () => {
    // 最近の発話内容をParking Lotに追加
    onAddToParkingLot(alert.recent_text);
    onClose();
  };

  const handleIgnore = () => {
    onIgnore();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="div">
            議題からの逸脱を検知
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {alert.message}
        </Alert>

        {/* 類似度スコア表示 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            類似度スコア
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" color="error">
              {(alert.similarity * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              （しきい値: 30%）
            </Typography>
          </Box>
        </Box>

        {/* 最近の発話内容 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            最近の発話内容
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              "{alert.recent_text}"
            </Typography>
          </Box>
        </Box>

        {/* 推奨アジェンダ */}
        {alert.suggestedTopics.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              推奨アジェンダ
            </Typography>
            <List dense>
              {alert.suggestedTopics.map((agenda, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={agenda}
                    secondary={`類似度: ${(alert.similarity * 100).toFixed(1)}%`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* アクション選択 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            次のアクションを選択してください
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {/* 軌道修正ボタン */}
        {alert.suggestedTopics.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleReturnToAgenda(alert.suggestedTopics[0])}
            sx={{ minWidth: 120 }}
          >
            議題に戻す
          </Button>
        )}

        {/* Parking Lot追加ボタン */}
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleAddToParkingLot}
          sx={{ minWidth: 120 }}
        >
          Parking Lotへ
        </Button>

        {/* 無視ボタン */}
        <Button
          variant="text"
          color="inherit"
          onClick={handleIgnore}
          sx={{ minWidth: 80 }}
        >
          無視
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviationAlertModal;
