"use client";

import { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { apiClient } from "@/lib/api";
import DeviationAlertModal from "../DeviationAlertModal";
import type { DeviationAlert } from "@/lib/types";

type AlertOperationsAreaProps = {
  meetingId: string;
  transcripts: any[]; // 文字起こし結果を受け取る
};

type ParkingLotItem = {
  id: string;
  title: string;
  description: string;
  addToNextAgenda: boolean;
  createdAt: string;
};

/**
 * セクションレベルコンポーネント: アラート・操作エリア
 * 
 * 脱線アラートとParking Lotの管理を行う
 */
const AlertOperationsArea: FC<AlertOperationsAreaProps> = ({ meetingId, transcripts }) => {
  const [currentAlert, setCurrentAlert] = useState<DeviationAlert | null>(null);
  const [parkingLot, setParkingLot] = useState<ParkingLotItem[]>([]);
  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [isCheckingDeviation, setIsCheckingDeviation] = useState(false);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);

  // モックParking Lotデータ
  const mockParkingLot: ParkingLotItem[] = [
    {
      id: "1",
      title: "会議室予約の話",
      description: "次回運用会議で検討",
      addToNextAgenda: false,
      createdAt: "12:30",
    },
    {
      id: "2",
      title: "ABテスト基盤の統合案",
      description: "技術検討が必要",
      addToNextAgenda: true,
      createdAt: "12:45",
    },
  ];

  // 初期データ設定
  useEffect(() => {
    setParkingLot(mockParkingLot);
  }, []);

  // 文字起こし結果が3つ以上になったら脱線検知を実行
  // ただし、既に検知済みのものは再度検知しない
  useEffect(() => {
    // 3つ以上溜まっていて、かつ前回チェック時よりも増えている場合
    if (transcripts.length >= 3 && transcripts.length > lastCheckedCount) {
      console.log("📊 脱線検知トリガー:", { 
        transcriptCount: transcripts.length, 
        lastChecked: lastCheckedCount 
      });
      checkForDeviation();
    }
  }, [transcripts.length, meetingId]);

  // 脱線検知を実行
  const checkForDeviation = async () => {
    if (isCheckingDeviation) return;
    
    setIsCheckingDeviation(true);
    try {
      console.log("🔍 脱線検知を実行中...", { meetingId, transcriptCount: transcripts.length });
      const deviationResult = await apiClient.checkDeviation(meetingId);
      
      // チェック済み数を更新
      setLastCheckedCount(transcripts.length);
      
      if (deviationResult.is_deviation) {
        console.log("⚠️ 脱線を検知:", deviationResult);
        setCurrentAlert(deviationResult);
        setShowDeviationModal(true);
      } else {
        console.log("✅ アジェンダに沿った発話:", deviationResult);
      }
    } catch (error) {
      console.error("❌ 脱線検知エラー:", error);
      // エラーの場合もチェック済みとしてカウント
      setLastCheckedCount(transcripts.length);
    } finally {
      setIsCheckingDeviation(false);
    }
  };

  // 脱線アラートのアクション処理
  const handleReturnToAgenda = (agenda: string) => {
    console.log("議題に戻す:", agenda);
    setCurrentAlert(null);
    // TODO: 実際の議題に戻す処理を実装
  };

  const handleAddToParkingLot = (topic: string) => {
    console.log("Parking Lotに追加:", topic);
    const newItem: ParkingLotItem = {
      id: Date.now().toString(),
      title: "脱線トピック",
      description: topic,
      addToNextAgenda: false,
      createdAt: new Date().toLocaleTimeString(),
    };
    setParkingLot(prev => [...prev, newItem]);
    setCurrentAlert(null);
  };

  const handleIgnoreDeviation = () => {
    console.log("脱線を無視");
    setCurrentAlert(null);
  };

  const handleParkingLotToggle = (id: string) => {
    setParkingLot(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, addToNextAgenda: !item.addToNextAgenda }
          : item
      )
    );
  };

  const handleDeleteParkingItem = (id: string) => {
    setParkingLot(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 脱線検知中インジケーター */}
      {isCheckingDeviation && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            🔍 脱線検知を実行中...
          </Typography>
        </Alert>
      )}

      {/* 脱線アラートモーダル */}
      <DeviationAlertModal
        open={showDeviationModal}
        alert={currentAlert}
        onClose={() => setShowDeviationModal(false)}
        onReturnToAgenda={handleReturnToAgenda}
        onAddToParkingLot={handleAddToParkingLot}
        onIgnore={handleIgnoreDeviation}
      />

      {/* Parking Lot */}
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Parking Lot
          </Typography>
          <Chip
            label={`${parkingLot.length}件`}
            size="small"
            color="primary"
          />
        </Box>

        {parkingLot.length > 0 ? (
          <List dense sx={{ py: 0, maxHeight: "300px", overflow: "auto" }}>
            {parkingLot.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                  py: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.title}
                      </Typography>
                      {item.addToNextAgenda && (
                        <Chip
                          label="次回追加"
                          size="small"
                          color="success"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.createdAt}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      checked={item.addToNextAgenda}
                      onChange={() => handleParkingLotToggle(item.id)}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteParkingItem(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Parking Lotは空です
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* クイック操作 */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          クイック操作
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            fullWidth
          >
            決定として確定
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            fullWidth
          >
            未決として保持
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            fullWidth
          >
            アクション作成
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AlertOperationsArea;
