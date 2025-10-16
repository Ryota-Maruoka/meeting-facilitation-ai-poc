"use client";

import { FC } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  Card, 
  Paper,
  Button,
  Chip
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Add as AddIcon, Summarize as SummarizeIcon } from "@mui/icons-material";
import Link from "next/link";
import MeetingHistoryList from "@/components/pages/MeetingHistoryList";
import { useMeetings } from "@/hooks/useMeetings";

/**
 * ページレベルコンポーネント: 履歴一覧画面
 * 
 * 過去の会議履歴を一覧表示し、詳細ページへの導線を提供する
 */
const HistoryPage: FC = () => {
  const { meetings, isLoading, error } = useMeetings();

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          エラー: {error}
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
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              会議履歴
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4, 
                opacity: 0.9,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              過去の会議を確認し、サマリや決定事項を振り返りましょう
            </Typography>
            <Button
              component={Link}
              href="/meetings/new"
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                },
                transition: "all 0.3s ease",
              }}
            >
              新しい会議を作成
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* 統計情報 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: "center", p: 3, bgcolor: "primary.50" }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {meetings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総会議数
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: "center", p: 3, bgcolor: "success.50" }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {meetings.filter(m => m.status === "completed").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                完了済み
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: "center", p: 3, bgcolor: "warning.50" }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {meetings.filter(m => m.status === "active").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                進行中
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: "center", p: 3, bgcolor: "info.50" }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {meetings.filter(m => m.status === "draft").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                下書き
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* 会議一覧 */}
        <MeetingHistoryList meetings={meetings} />
      </Container>
    </Box>
  );
};

export default HistoryPage;