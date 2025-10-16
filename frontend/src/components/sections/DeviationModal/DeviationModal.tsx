"use client";

import { FC, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  LocalParking as ParkingIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { formatDateTime } from "@/lib/utils";
import type { DeviationAlert } from "@/lib/types";

type DeviationModalProps = {
  open: boolean;
  alert: DeviationAlert | null;
  onReturnToAgenda: (topic: string) => void;
  onAddToParkingLot: (title: string, content: string, addToNextAgenda: boolean) => void;
  onDismiss: () => void;
  onClose: () => void;
};

/**
 * セクションレベルコンポーネント: 脱線モーダル
 * 
 * 会議がアジェンダから逸脱した際のモーダル表示と対応アクション
 * 
 * @param props - コンポーネントのプロパティ
 * @returns 脱線モーダルの JSX 要素
 */
const DeviationModal: FC<DeviationModalProps> = ({
  open,
  alert,
  onReturnToAgenda,
  onAddToParkingLot,
  onDismiss,
  onClose,
}) => {
  const [parkingLotTitle, setParkingLotTitle] = useState("");
  const [addToNextAgenda, setAddToNextAgenda] = useState(false);

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

  const handleReturnToAgenda = (topic: string) => {
    onReturnToAgenda(topic);
    onClose();
  };

  const handleAddToParkingLot = () => {
    if (parkingLotTitle.trim()) {
      onAddToParkingLot(parkingLotTitle.trim(), alert?.message || "", addToNextAgenda);
      setParkingLotTitle("");
      setAddToNextAgenda(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  if (!alert) return null;

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
          <Typography variant="h6">
            議題からの逸脱を検知
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {alert.message}
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              類似度:
            </Typography>
            <Chip
              label={getSimilarityLabel(alert.similarity)}
              color={getSimilarityColor(alert.similarity)}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              ({alert.similarity.toFixed(2)})
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            検知時刻: {formatDateTime(alert.created_at)}
          </Typography>
        </Box>

        {alert.suggestedTopics.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
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

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Parking Lotに退避
          </Typography>
          <TextField
            label="件名"
            value={parkingLotTitle}
            onChange={(e) => setParkingLotTitle(e.target.value)}
            fullWidth
            placeholder="例: 会議室予約の話→次回運用会議で"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={addToNextAgenda}
                onChange={(e) => setAddToNextAgenda(e.target.checked)}
              />
            }
            label="次回アジェンダに自動追加する"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleDismiss} startIcon={<CloseIcon />}>
          無視
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ParkingIcon />}
          onClick={handleAddToParkingLot}
          disabled={!parkingLotTitle.trim()}
        >
          Parking Lotへ送る
        </Button>
        
        {alert.suggestedTopics.map((topic, index) => (
          <Button
            key={index}
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => handleReturnToAgenda(topic)}
          >
            議題「{topic}」へ戻す
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default DeviationModal;
