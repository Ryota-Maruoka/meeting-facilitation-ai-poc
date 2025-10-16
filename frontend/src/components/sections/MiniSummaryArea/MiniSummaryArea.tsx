"use client";

import { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

type MiniSummaryAreaProps = {
  meetingId: string;
};

type MiniSummary = {
  decisions: string[];
  unresolved: string[];
  actions: string[];
  lastUpdated: string;
};

/**
 * セクションレベルコンポーネント: ミニ要約表示エリア
 * 
 * 会議中の決定事項、未決事項、アクションをリアルタイム表示
 */
const MiniSummaryArea: FC<MiniSummaryAreaProps> = ({ meetingId }) => {
  const [summary, setSummary] = useState<MiniSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モックデータ（後で実際のAPI連携に置き換え）
  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // モックデータ
        const mockSummary: MiniSummary = {
          decisions: [
            "バックエンドはAPI A採用。理由：互換性と運用負荷。",
          ],
          unresolved: [
            "認可方式（JWT vs MTLS）",
            "基盤運用方針の確認",
          ],
          actions: [
            "佐藤：JWT PoC実施（期限：10/18）",
            "鈴木：SLA要件確認（期限：10/15）",
          ],
          lastUpdated: new Date().toLocaleTimeString(),
        };

        // リアルタイム感を演出するため少し遅延
        setTimeout(() => {
          setSummary(mockSummary);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError("要約の取得に失敗しました");
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [meetingId]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          要約データがありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 最終更新時刻 */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
        最終更新: {summary.lastUpdated}
      </Typography>

      {/* 決定事項 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            決定
          </Typography>
          <Chip
            label={summary.decisions.length}
            size="small"
            color="success"
            sx={{ ml: 1 }}
          />
        </Box>
        
        {summary.decisions.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {summary.decisions.map((decision, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {decision}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            （空）
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 未決事項 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <HelpIcon color="warning" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            未決
          </Typography>
          <Chip
            label={summary.unresolved.length}
            size="small"
            color="warning"
            sx={{ ml: 1 }}
          />
        </Box>
        
        {summary.unresolved.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {summary.unresolved.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {item}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            （空）
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* アクション */}
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <AssignmentIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            アクション
          </Typography>
          <Chip
            label={summary.actions.length}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        </Box>
        
        {summary.actions.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {summary.actions.map((action, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {action}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            （空）
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MiniSummaryArea;
