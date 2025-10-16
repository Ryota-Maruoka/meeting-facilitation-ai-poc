"use client";

import { FC } from "react";
import Link from "next/link";
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  Paper
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { 
  Add as AddIcon, 
  History as HistoryIcon,
  Mic as MicIcon,
  Summarize as SummarizeIcon,
  Assignment as AssignmentIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

/**
 * ページレベルコンポーネント: ホーム画面
 * 
 * 会議ファシリテーションアプリのトップページ
 * Figmaデザインに基づいたモダンなUI
 */
const HomePage: FC = () => {
  const features = [
    {
      icon: <MicIcon sx={{ fontSize: 24 }} />,
      title: "音声文字起こし",
      description: "会議音声をリアルタイムで文字起こし",
      color: "primary" as const,
    },
    {
      icon: <SummarizeIcon sx={{ fontSize: 24 }} />,
      title: "要約生成",
      description: "3分間隔で要約を自動更新",
      color: "secondary" as const,
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 24 }} />,
      title: "未決事項抽出",
      description: "決まっていない議題を自動検出",
      color: "warning" as const,
    },
    {
      icon: <LightbulbIcon sx={{ fontSize: 24 }} />,
      title: "提案生成",
      description: "次のアクション候補を提示",
      color: "info" as const,
    },
    {
      icon: <WarningIcon sx={{ fontSize: 24 }} />,
      title: "脱線検知",
      description: "アジェンダからの逸脱を通知",
      color: "error" as const,
    },
    {
      icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
      title: "決定ログ",
      description: "決定事項を確定記録",
      color: "success" as const,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: "linear-gradient(45deg, #ffffff 30%, #f0f9ff 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Meeting Facilitation AI
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                opacity: 0.9,
                maxWidth: 600,
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              AIを活用した会議ファシリテーションで、より効率的で生産性の高い会議を実現
            </Typography>
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 4 }}
            >
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
                会議を開始
              </Button>
              <Button
                component={Link}
                href="/history"
                variant="outlined"
                size="large"
                startIcon={<HistoryIcon />}
                sx={{
                  borderColor: "white",
                  color: "white",
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                履歴を確認
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            textAlign="center" 
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            主な機能
          </Typography>
          <Typography 
            variant="h6" 
            textAlign="center" 
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 600, mx: "auto" }}
          >
            最新のAI技術を活用して、会議の効率性と生産性を向上させます
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    p: 3,
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: `${feature.color}.50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                      color: `${feature.color}.main`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            今すぐ会議を始めましょう
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
            AIが会議をサポートし、より効率的で価値のある時間を提供します
          </Typography>
          <Button
            component={Link}
            href="/meetings/new"
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            会議を作成
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default HomePage;
