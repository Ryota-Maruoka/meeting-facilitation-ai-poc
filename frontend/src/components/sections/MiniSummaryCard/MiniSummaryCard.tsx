"use client";

import { FC } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { formatDateTime } from "@/lib/utils";
import type { MiniSummary, Decision, Action } from "@/lib/types";

type MiniSummaryCardProps = {
  miniSummary: MiniSummary | null;
  decisions: Decision[];
  actions: Action[];
};

/**
 * セクションレベルコンポーネント: ミニ要約カード
 * 
 * 会議中の要約情報、決定事項、未決事項、アクションを表示
 * 
 * @param props - コンポーネントのプロパティ
 * @returns ミニ要約カードの JSX 要素
 */
const MiniSummaryCard: FC<MiniSummaryCardProps> = ({
  miniSummary,
  decisions,
  actions,
}) => {
  const unresolvedItems = miniSummary?.unresolved || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 要約内容 */}
      {miniSummary ? (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            最新要約 ({formatDateTime(miniSummary.generated_at)})
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {miniSummary.content}
          </Typography>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          要約が生成されていません
        </Alert>
      )}

      {/* 決定事項 */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckIcon color="success" fontSize="small" />
            <Typography variant="subtitle2">
              決定事項
            </Typography>
            <Chip label={decisions.length} size="small" color="success" />
          </Box>
          
          {decisions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              決定事項はありません
            </Typography>
          ) : (
            <List dense>
              {decisions.map((decision, index) => (
                <ListItem key={decision.id || index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={decision.content}
                    secondary={`${decision.decided_by} - ${formatDateTime(decision.decided_at)}`}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* 未決事項 */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <WarningIcon color="warning" fontSize="small" />
            <Typography variant="subtitle2">
              未決事項
            </Typography>
            <Chip label={unresolvedItems.length} size="small" color="warning" />
          </Box>
          
          {unresolvedItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              未決事項はありません
            </Typography>
          ) : (
            <List dense>
              {unresolvedItems.map((item, index) => (
                <Box key={item.id || index}>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
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
                        </Box>
                      }
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                  {index < unresolvedItems.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* アクション */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AssignmentIcon color="info" fontSize="small" />
            <Typography variant="subtitle2">
              アクション
            </Typography>
            <Chip label={actions.length} size="small" color="info" />
          </Box>
          
          {actions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              アクションはありません
            </Typography>
          ) : (
            <List dense>
              {actions.map((action, index) => (
                <ListItem key={action.id || index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={action.content}
                    secondary={`${action.assignee} - ${action.dueDate}`}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MiniSummaryCard;
