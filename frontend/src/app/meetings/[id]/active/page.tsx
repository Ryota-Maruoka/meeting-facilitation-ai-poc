"use client";

import { FC, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Box, Alert, CircularProgress } from "@mui/material";
import { useMeeting } from "@/hooks/useMeeting";
import { apiClient } from "@/lib/api";
import MeetingActiveView from "@/components/pages/MeetingActiveView";

/**
 * ページレベルコンポーネント: 会議中画面
 * 
 * 会議進行中のメイン画面を表示
 */
const MeetingActivePage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  const { meeting, isLoading, error } = useMeeting(meetingId);

  const handleEndMeeting = async () => {
    try {
      // 会議ステータスを「完了」に更新
      await apiClient.updateMeeting(meetingId, { 
        status: "completed",
        ended_at: new Date().toISOString()
      });
      
      // 要約画面に遷移
      router.push(`/meetings/${meetingId}/summary`);
    } catch (error) {
      console.error("会議終了処理エラー:", error);
      // エラーが発生しても要約画面に遷移
      router.push(`/meetings/${meetingId}/summary`);
    }
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
    <MeetingActiveView
      meeting={meeting}
      onEndMeeting={handleEndMeeting}
    />
  );
};

export default MeetingActivePage;
