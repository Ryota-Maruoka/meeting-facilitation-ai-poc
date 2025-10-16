"use client";

import { FC, useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  ArrowBack as ArrowBackIcon,
  Stop as StopIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  FileDownload as FileDownloadIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import type { Meeting, Transcript } from "@/lib/types";
import AgendaProgressBar from "@/components/sections/AgendaProgressBar";
import LiveTranscriptArea from "@/components/sections/LiveTranscriptArea";
import MiniSummaryArea from "@/components/sections/MiniSummaryArea";
import AlertOperationsArea from "@/components/sections/AlertOperationsArea";
import QuickActionsBar from "@/components/sections/QuickActionsBar";

type MeetingActiveViewProps = {
  meeting: Meeting;
  onEndMeeting: () => void;
};

/**
 * ページレベルコンポーネント: 会議中画面（画面B）
 * 
 * 会議進行中のメイン画面。ライブ字幕、要約、アラート、操作ボタンを表示
 */
const MeetingActiveView: FC<MeetingActiveViewProps> = ({
  meeting,
  onEndMeeting,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [remainingTime, setRemainingTime] = useState("00:00");
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  // 残り時間の計算（仮実装）
  useEffect(() => {
    if (meeting.agenda && meeting.agenda.length > 0) {
      const totalMinutes = meeting.agenda.reduce(
        (total, item) => total + item.duration,
        0
      );
      setRemainingTime(`${totalMinutes}:00`);
    } else {
      setRemainingTime("00:00");
    }
  }, [meeting.agenda]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // LiveTranscriptAreaで実際の録音処理が実行される
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // LiveTranscriptAreaで実際の録音停止処理が実行される
  };

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
                会議中: {meeting.title}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip
                icon={isRecording ? <MicIcon /> : <MicOffIcon />}
                label={isRecording ? "録音中" : "録音停止"}
                color={isRecording ? "error" : "default"}
                variant={isRecording ? "filled" : "outlined"}
                sx={{ 
                  bgcolor: isRecording ? "error.main" : "rgba(255,255,255,0.2)",
                  color: "white",
                  "& .MuiChip-icon": { color: "white" }
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                残り: {remainingTime}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<FileDownloadIcon />}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
              }}
            >
              サマリ出力
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<StopIcon />}
              onClick={onEndMeeting}
              sx={{ 
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" }
              }}
            >
              会議終了
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* アジェンダ進捗 */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <AssignmentIcon color="primary" />
                  アジェンダ進捗
                </Typography>
                <AgendaProgressBar
                  agenda={meeting.agenda}
                  currentIndex={currentAgendaIndex}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* メインコンテンツエリア */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "500px" }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MicIcon color="primary" />
                  ライブ字幕
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                <LiveTranscriptArea
                  meetingId={meeting.id}
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onTranscriptsUpdate={handleTranscriptsUpdate}
                />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ミニ要約エリア */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "500px" }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  ミニ要約
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <MiniSummaryArea meetingId={meeting.id} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* アラート/操作エリア */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "500px" }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon color="primary" />
                  アラート・操作
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <AlertOperationsArea meetingId={meeting.id} transcripts={transcripts} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* クイック操作バー */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <ScheduleIcon color="primary" />
                  クイック操作
                </Typography>
                <QuickActionsBar meetingId={meeting.id} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MeetingActiveView;