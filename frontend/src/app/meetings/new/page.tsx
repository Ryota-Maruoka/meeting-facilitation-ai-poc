"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Box, Alert } from "@mui/material";
import MeetingCreationForm from "@/components/pages/MeetingCreationForm";
import { useMeetings } from "@/hooks/useMeetings";

/**
 * ページレベルコンポーネント: 会議作成画面
 * 
 * 新規会議の作成フォームを表示し、会議の基本情報とアジェンダを設定する
 */
const NewMeetingPage: FC = () => {
  const router = useRouter();
  const { createMeeting, error } = useMeetings();

  const handleSuccess = (meetingId: string) => {
    // 会議作成成功後、会議詳細ページに遷移
    router.push(`/meetings/${meetingId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新規会議作成
        </Typography>
        <Typography variant="body1" color="text.secondary">
          会議の基本情報とアジェンダを設定して、効率的な会議を開始しましょう
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          エラー: {error}
        </Alert>
      )}

      <MeetingCreationForm
        onSubmit={createMeeting}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default NewMeetingPage;