"use client";

import { FC, useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Stop as StopIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import type { Meeting, Transcript } from "@/lib/types";
import AgendaProgressBar from "@/components/sections/AgendaProgressBar";
import LiveTranscriptArea from "@/components/sections/LiveTranscriptArea";
import { SummarySection, AlertSection } from "./sections";

type MeetingActiveViewProps = {
  meeting: Meeting;
  onEndMeeting: () => void;
};

/**
 * ページレベルコンポーネント: 会議中画面（画面B）
 * 
 * 会議進行中のメイン画面。自動録音、ライブ字幕、要約、アラートを表示
 */
const MeetingActiveView: FC<MeetingActiveViewProps> = ({
  meeting,
  onEndMeeting,
}) => {
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  // 経過時間の更新（1秒ごと）
  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 1;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setElapsedTime(
        `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 文字起こし結果を受け取るコールバック
  const handleTranscriptsUpdate = (newTranscripts: Transcript[]) => {
    setTranscripts(newTranscripts);
  };

  const handleBack = () => {
    // 会議詳細画面に戻る
    window.history.back();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ヘッダー */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ 
                  color: "white", 
                  mr: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                }}
              >
                戻る
              </Button>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                {meeting.title}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {elapsedTime}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<StopIcon />}
              onClick={onEndMeeting}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.9)",
                color: "primary.main",
                fontWeight: 600,
                "&:hover": { bgcolor: "white" }
              }}
            >
              会議終了
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* アジェンダ進捗 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
            >
              <AssignmentIcon color="primary" />
              アジェンダ進捗
            </Typography>
            <AgendaProgressBar
              agenda={meeting.agenda}
              currentIndex={currentAgendaIndex}
            />
          </CardContent>
        </Card>

        {/* メインコンテンツエリア */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
            gap: 3,
          }}
        >
          {/* ライブ字幕エリア */}
          <LiveTranscriptArea
            meetingId={meeting.id}
            onTranscriptsUpdate={handleTranscriptsUpdate}
          />

          {/* ミニ要約エリア */}
          <SummarySection meetingId={meeting.id} />

          {/* アラート/操作エリア */}
          <AlertSection meetingId={meeting.id} transcripts={transcripts} />
        </Box>
      </Container>
    </Box>
  );
};

export default MeetingActiveView;