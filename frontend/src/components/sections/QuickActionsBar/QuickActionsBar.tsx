"use client";

import { FC } from "react";
import {
  Box,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Assignment as AssignmentIcon,
  Send as SendIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";

type QuickActionsBarProps = {
  meetingId: string;
};

/**
 * セクションレベルコンポーネント: クイック操作バー
 * 
 * 会議中の頻繁に使用する操作ボタンを提供
 */
const QuickActionsBar: FC<QuickActionsBarProps> = ({ meetingId }) => {
  const handleDecisionConfirm = () => {
    // TODO: 決定事項の確定処理
    console.log("決定として確定");
  };

  const handleUnresolvedKeep = () => {
    // TODO: 未決事項の保持処理
    console.log("未決として保持");
  };

  const handleActionCreate = () => {
    // TODO: アクション作成処理
    console.log("アクション作成");
  };

  const handleSlackSend = () => {
    // TODO: Slack送信処理
    console.log("Slack送信");
  };

  const handleSummaryDownload = () => {
    // TODO: サマリダウンロード処理
    console.log("サマリダウンロード");
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 2 }}>
        クイック操作:
      </Typography>

      {/* 決定・未決・アクション操作 */}
      <Button
        variant="contained"
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={handleDecisionConfirm}
        size="small"
      >
        決定として確定
      </Button>

      <Button
        variant="contained"
        color="warning"
        startIcon={<HelpIcon />}
        onClick={handleUnresolvedKeep}
        size="small"
      >
        未決として保持
      </Button>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AssignmentIcon />}
        onClick={handleActionCreate}
        size="small"
      >
        アクション作成
      </Button>

      <Divider orientation="vertical" flexItem />

      {/* 送信・ダウンロード操作 */}
      <Button
        variant="outlined"
        startIcon={<SendIcon />}
        onClick={handleSlackSend}
        size="small"
      >
        Slack送信
      </Button>

      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        onClick={handleSummaryDownload}
        size="small"
      >
        サマリ出力
      </Button>
    </Box>
  );
};

export default QuickActionsBar;
