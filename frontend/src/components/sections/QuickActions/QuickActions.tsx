"use client";

import { FC, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useMeeting } from "@/hooks/useMeeting";
import type { Decision, Action } from "@/lib/types";

type QuickActionsProps = {
  meetingId: string;
  decisions: Decision[];
  actions: Action[];
};

/**
 * セクションレベルコンポーネント: クイック操作
 * 
 * 会議中の決定事項追加、アクション作成、Slack送信などのクイック操作
 * 
 * @param props - コンポーネントのプロパティ
 * @returns クイック操作の JSX 要素
 */
const QuickActions: FC<QuickActionsProps> = ({ meetingId, decisions, actions }) => {
  const { createDecision, createAction, sendToSlack } = useMeeting(meetingId);
  
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  
  const [decisionForm, setDecisionForm] = useState({
    content: "",
    reason: "",
    decided_by: "",
  });
  
  const [actionForm, setActionForm] = useState({
    content: "",
    assignee: "",
    dueDate: "",
  });
  
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  const handleCreateDecision = async () => {
    try {
      await createDecision(decisionForm);
      setDecisionDialogOpen(false);
      setDecisionForm({ content: "", reason: "", decided_by: "" });
    } catch (error) {
      console.error("Failed to create decision:", error);
    }
  };

  const handleCreateAction = async () => {
    try {
      await createAction(actionForm);
      setActionDialogOpen(false);
      setActionForm({ content: "", assignee: "", dueDate: "" });
    } catch (error) {
      console.error("Failed to create action:", error);
    }
  };

  const handleSendToSlack = async () => {
    try {
      await sendToSlack(slackWebhookUrl);
      setSlackDialogOpen(false);
      setSlackWebhookUrl("");
    } catch (error) {
      console.error("Failed to send to Slack:", error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          onClick={() => setDecisionDialogOpen(true)}
        >
          決定として確定
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<AssignmentIcon />}
          onClick={() => setActionDialogOpen(true)}
        >
          アクション作成
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<SendIcon />}
          onClick={() => setSlackDialogOpen(true)}
        >
          Slack送信
        </Button>
        
        <Button
          variant="text"
          startIcon={<RefreshIcon />}
          onClick={() => {
            // 要約再生成機能（実装予定）
            console.log("要約再生成");
          }}
        >
          要約再生成
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Chip
          label={`決定: ${decisions.length}件`}
          color="success"
          variant="outlined"
        />
        <Chip
          label={`アクション: ${actions.length}件`}
          color="info"
          variant="outlined"
        />
      </Box>

      {/* 決定事項作成ダイアログ */}
      <Dialog open={decisionDialogOpen} onClose={() => setDecisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>決定事項を追加</DialogTitle>
        <DialogContent>
          <TextField
            label="決定内容"
            value={decisionForm.content}
            onChange={(e) => setDecisionForm(prev => ({ ...prev, content: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            label="決定理由"
            value={decisionForm.reason}
            onChange={(e) => setDecisionForm(prev => ({ ...prev, reason: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            label="決定者"
            value={decisionForm.decided_by}
            onChange={(e) => setDecisionForm(prev => ({ ...prev, decided_by: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleCreateDecision} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>

      {/* アクション作成ダイアログ */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>アクションを追加</DialogTitle>
        <DialogContent>
          <TextField
            label="アクション内容"
            value={actionForm.content}
            onChange={(e) => setActionForm(prev => ({ ...prev, content: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            label="担当者"
            value={actionForm.assignee}
            onChange={(e) => setActionForm(prev => ({ ...prev, assignee: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="期限"
            type="date"
            value={actionForm.dueDate}
            onChange={(e) => setActionForm(prev => ({ ...prev, dueDate: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleCreateAction} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>

      {/* Slack送信ダイアログ */}
      <Dialog open={slackDialogOpen} onClose={() => setSlackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Slackに送信</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            会議のサマリとアクションをSlackに送信します
          </Typography>
          <TextField
            label="Slack Webhook URL"
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
            fullWidth
            placeholder="https://hooks.slack.com/services/..."
            helperText="SlackのIncoming Webhook URLを入力してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlackDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSendToSlack} variant="contained" disabled={!slackWebhookUrl}>
            送信
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickActions;
