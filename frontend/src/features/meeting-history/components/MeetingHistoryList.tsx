"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  Summarize as SummaryIcon,
} from "@mui/icons-material";
import { formatDate, formatDateTime } from "@/shared/lib/utils";
import type { Meeting } from "@/shared/lib/types";

type MeetingHistoryListProps = {
  meetings: Meeting[];
};

/**
 * 会議履歴一覧コンポーネント
 *
 * 会議の一覧を表示し、クリックで詳細ページへ遷移する
 *
 * @param props.meetings - 会議データの配列
 * @returns 会議履歴一覧の JSX 要素
 */
const MeetingHistoryList: FC<MeetingHistoryListProps> = ({ meetings }) => {
  const router = useRouter();

  const handleSelectMeeting = (meetingId: string) => {
    router.push(`/meetings/${meetingId}` as any);
  };

  const handleViewSummary = (meetingId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // カードクリックイベントを防ぐ
    router.push(`/meetings/${meetingId}/summary` as any);
  };

  const getStatusColor = (status: Meeting["status"]) => {
    switch (status) {
      case "draft":
        return "default";
      case "active":
        return "primary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: Meeting["status"]) => {
    switch (status) {
      case "draft":
        return "下書き";
      case "active":
        return "進行中";
      case "completed":
        return "完了";
      default:
        return "不明";
    }
  };

  const getStatusIcon = (status: Meeting["status"]) => {
    switch (status) {
      case "draft":
        return <ScheduleIcon />;
      case "active":
        return <PlayIcon />;
      case "completed":
        return <CheckIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  if (meetings.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          会議履歴がありません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          新規会議を作成して、AIによるファシリテーション支援を開始しましょう
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {meetings.map((meeting) => (
        <Card
          key={meeting.id}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              boxShadow: 4,
              transform: "translateY(-2px)",
            },
          }}
          onClick={() => handleSelectMeeting(meeting.id)}
        >
          <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Typography variant="h6" component="h3" sx={{ flexGrow: 1, mr: 1 }}>
                  {meeting.title}
                </Typography>
                <Chip
                  icon={getStatusIcon(meeting.status)}
                  label={getStatusLabel(meeting.status)}
                  color={getStatusColor(meeting.status)}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {meeting.purpose}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  期待する成果物
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                  {meeting.expectedOutcome}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {meeting.participants.length}名
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(meeting.created_at)}
                  </Typography>
                </Box>
              </Box>

              {meeting.participants.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    参加者
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {meeting.participants.slice(0, 3).map((participant, index) => (
                      <Chip
                        key={index}
                        label={participant}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    ))}
                    {meeting.participants.length > 3 && (
                      <Chip
                        label={`+${meeting.participants.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(meeting.updated_at)}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {meeting.status === "completed" && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SummaryIcon />}
                      onClick={(e) => handleViewSummary(meeting.id, e)}
                      sx={{
                        bgcolor: "success.main",
                        "&:hover": { bgcolor: "success.dark" }
                      }}
                    >
                      要約
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMeeting(meeting.id);
                    }}
                  >
                    詳細を見る
                  </Button>
                </Box>
              </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default MeetingHistoryList;
