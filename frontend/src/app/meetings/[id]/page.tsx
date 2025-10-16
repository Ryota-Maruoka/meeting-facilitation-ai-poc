"use client";

import { FC } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Container, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  Card, 
  CardContent,
  Button,
  Chip,
  Paper
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { 
  PlayArrow as PlayArrowIcon, 
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  RecordVoiceOver as RecordIcon
} from "@mui/icons-material";
import { useMeeting } from "@/hooks/useMeeting";

/**
 * ページレベルコンポーネント: 会議詳細画面
 * 
 * 会議の詳細情報を表示し、会議中画面への遷移を提供
 */
const MeetingDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  const { meeting, isLoading, error } = useMeeting(meetingId);

  const handleStartMeeting = () => {
    // 会議開始処理：会議中画面に遷移
    router.push(`/meetings/${meetingId}/active`);
  };

  const handleEndMeeting = () => {
    // 会議終了処理（後で実装）
    console.log("会議を終了:", meetingId);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          会議情報を読み込み中...
        </Typography>
      </Container>
    );
  }

  if (error || !meeting) {
  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          エラー: {error || "会議が見つかりません"}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          {/* ヘッダー */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ 
                color: "white", 
                mr: 2,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
              }}
            >
              戻る
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              会議詳細
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* 会議基本情報 */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {meeting.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>目的:</strong> {meeting.purpose}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  <strong>期待する成果物:</strong> {meeting.expectedOutcome}
                </Typography>
                
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`参加者 ${meeting.participants.length}名`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`合計時間 ${meeting.agenda?.reduce((total, item) => total + item.duration, 0) || 0}分`}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    label={meeting.status === "draft" ? "下書き" : "準備完了"}
                    color={meeting.status === "draft" ? "default" : "success"}
                    variant="filled"
                  />
                  <Chip
                    icon={<RecordIcon />}
                    label={meeting.recordingConsent ? "録音同意済み" : "録音未同意"}
                    color={meeting.recordingConsent ? "success" : "warning"}
                    variant="outlined"
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartMeeting}
                  sx={{ 
                    bgcolor: "success.main",
                    "&:hover": { bgcolor: "success.dark" }
                  }}
                >
                  会議を開始
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* 参加者 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon color="primary" />
                  参加者
                </Typography>
                {meeting.participants.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {meeting.participants.map((participant, index) => (
                      <Chip
                        key={index}
                        label={participant}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    参加者が設定されていません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* アジェンダ */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  アジェンダ
                </Typography>
                {meeting.agenda && meeting.agenda.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {meeting.agenda.map((item, index) => (
                      <Paper
                        key={item.id || index}
                        sx={{
                          p: 2,
                          borderLeft: 4,
                          borderLeftColor: "primary.main",
                          bgcolor: "grey.50",
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                          {index + 1}. {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          時間: {item.duration}分
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          期待成果: {item.expectedOutcome}
                        </Typography>
                        {item.relatedUrl && (
                          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                            関連資料: {item.relatedUrl}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    アジェンダが設定されていません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MeetingDetailPage;