"use client";

import { FC, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
} from "@mui/material";
import { Send as SendIcon, Download as DownloadIcon } from "@mui/icons-material";
import { formatDateTime } from "@/lib/utils";
import type { Meeting, MeetingSummary } from "@/lib/types";

type MeetingSummaryViewProps = {
  meeting: Meeting;
  summary: MeetingSummary | null;
  onSendToSlack: (webhookUrl: string) => void;
};

/**
 * ページレベルコンポーネント: 会議後サマリ表示
 * 
 * 会議のサマリ内容をMarkdown形式で表示し、Slack送信機能を提供
 * 
 * @param props - コンポーネントのプロパティ
 * @returns 会議後サマリ表示の JSX 要素
 */
const MeetingSummaryView: FC<MeetingSummaryViewProps> = ({
  meeting,
  summary,
  onSendToSlack,
}) => {
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleSendToSlack = () => {
    if (webhookUrl) {
      onSendToSlack(webhookUrl);
      setSlackDialogOpen(false);
      setWebhookUrl("");
    }
  };

  const handleDownloadMarkdown = () => {
    if (!summary) return;
    
    const blob = new Blob([summary.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <Alert severity="info">
        サマリが生成されていません。「サマリを生成」ボタンをクリックして生成してください。
      </Alert>
    );
  }

  return (
    <Box>
      {/* サマリ本文 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            要約本文
          </Typography>
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            {summary.content}
          </Box>
        </CardContent>
      </Card>

      {/* 決定事項 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            決定事項
          </Typography>
          {summary.decisions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              決定事項はありません
            </Typography>
          ) : (
            <List>
              {summary.decisions.map((decision, index) => (
                <Box key={decision.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={decision.content}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            理由: {decision.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            決定者: {decision.decided_by} - {formatDateTime(decision.decided_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < summary.decisions.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* 未決事項 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            未決事項（提案付き）
          </Typography>
          {summary.unresolved.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              未決事項はありません
            </Typography>
          ) : (
            <List>
              {summary.unresolved.map((item, index) => (
                <Box key={item.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={item.topic}
                      secondary={
                        <Box>
                          {item.missingInfo.length > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              不足情報: {item.missingInfo.join(", ")}
                            </Typography>
                          )}
                          {item.nextSteps.length > 0 && (
                            <Typography variant="caption" color="primary" display="block">
                              次の一手: {item.nextSteps.join(", ")}
                            </Typography>
                          )}
                          <Chip
                            label={`優先度: ${item.priority}`}
                            size="small"
                            color={item.priority === "high" ? "error" : item.priority === "medium" ? "warning" : "default"}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < summary.unresolved.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* アクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            アクション
          </Typography>
          {summary.actions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              アクションはありません
            </Typography>
          ) : (
            <List>
              {summary.actions.map((action, index) => (
                <Box key={action.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={action.content}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            担当者: {action.assignee}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            期限: {action.dueDate}
                          </Typography>
                          <Chip
                            label={action.status === "completed" ? "完了" : action.status === "in_progress" ? "進行中" : "未着手"}
                            size="small"
                            color={action.status === "completed" ? "success" : action.status === "in_progress" ? "primary" : "default"}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < summary.actions.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Parking Lot */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Parking Lot
          </Typography>
          {summary.parkingLot.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Parking Lotに退避されたトピックはありません
            </Typography>
          ) : (
            <List>
              {summary.parkingLot.map((item, index) => (
                <Box key={item.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={item.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {item.content}
                          </Typography>
                          {item.addToNextAgenda && (
                            <Chip
                              label="次回アジェンダに追加"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < summary.parkingLot.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* 操作ボタン */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadMarkdown}
        >
          Markdownをダウンロード
        </Button>
        <Button
          variant="outlined"
          startIcon={<SendIcon />}
          onClick={() => setSlackDialogOpen(true)}
        >
          Slackに送信
        </Button>
      </Box>

      {/* Slack送信ダイアログ */}
      <Dialog open={slackDialogOpen} onClose={() => setSlackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Slackに送信</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            会議のサマリとアクションをSlackに送信します
          </Typography>
          <TextField
            label="Slack Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            fullWidth
            placeholder="https://hooks.slack.com/services/..."
            helperText="SlackのIncoming Webhook URLを入力してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlackDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSendToSlack} variant="contained" disabled={!webhookUrl}>
            送信
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingSummaryView;
