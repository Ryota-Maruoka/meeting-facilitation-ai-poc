"use client";

import { FC, useState, useEffect } from "react";
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
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Summarize as SummarizeIcon,
  Warning as WarningIcon,
  LocalParking as LocalParkingIcon
} from "@mui/icons-material";
import { useMeeting } from "@/hooks/useMeeting";
import { apiClient } from "@/lib/api";

/**
 * ページレベルコンポーネント: 会議要約画面
 * 
 * 会議終了後のサマリを表示し、ダウンロードやSlack送信機能を提供
 */
const MeetingSummaryPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  const { meeting, isLoading, error } = useMeeting(meetingId);
  const [summary, setSummary] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // 会議サマリを生成
  const generateSummary = async () => {
    if (!meeting) return;
    
    setIsGeneratingSummary(true);
    try {
      // 要約データを生成
      const mockSummary = {
        title: meeting.title,
        purpose: meeting.purpose,
        participants: meeting.participants,
        duration: "60分",
        date: "2025-10-07",
        // D-2: 要約本文
        overallSummary: "要件すり合わせ会議では、認証方式の比較検討を中心に議論が行われ、バックエンドAPIの採用方針が決定されました。",
        keyPoints: [
          "認証方式の比較観点（性能/運用/障害時復旧）",
          "JWTとMTLSの運用負荷の違い",
          "セキュリティ要件の再確認が必要"
        ],
        // D-3: 決定事項
        decisions: [
          {
            description: "バックエンドはAPI A採用。理由：互換性と運用負荷。",
            approver: "田中",
            decidedAt: "12:05"
          }
        ],
        // D-4: 未決事項（提案付き）
        unresolved: [
          {
            topic: "認可方式（JWT vs MTLS）",
            missingInfo: "基盤運用方針・障害事例",
            nextAction: "PoC比較＋セキュリティレビュー依頼"
          }
        ],
        // D-5: アクションアイテム
        actions: [
          {
            task: "JWT PoC実施",
            assignee: "佐藤",
            dueDate: "10/18"
          },
          {
            task: "SLA要件確認",
            assignee: "鈴木",
            dueDate: "10/15"
          }
        ],
        // D-6: Parking Lot
        parkingLot: [
          "ABテスト基盤の統合案"
        ]
      };
      
      // 2秒の遅延をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 要約を会議データに保存
      try {
        await apiClient.updateMeeting(meetingId, {
          summary: mockSummary
        });
      } catch (saveError) {
        console.warn("要約の保存に失敗しました:", saveError);
        // 保存に失敗しても表示は続行
      }
      
      setSummary(mockSummary);
    } catch (error) {
      console.error("サマリ生成エラー:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (meeting && !summary) {
      generateSummary();
    }
  }, [meeting]);

  const handleDownloadSummary = () => {
    // TODO: 実際のダウンロード機能を実装
    console.log("サマリをダウンロード");
  };

  const handleSendToSlack = () => {
    // TODO: 実際のSlack送信機能を実装
    console.log("Slackに送信");
  };

  const handleCopyMarkdown = () => {
    // TODO: Markdown形式でコピー機能を実装
    console.log("Markdownをコピー");
  };

  const handleBackToList = () => {
    router.push("/history");
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
              onClick={handleBackToList}
              sx={{ 
                color: "white", 
                mr: 2,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
              }}
            >
              一覧に戻る
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              会議サマリ: {meeting?.title}（{summary?.date || "2025-10-07"}）
            </Typography>
          </Box>
          
          {/* D-1: ヘッダーボタン */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyMarkdown}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
              }}
            >
              Markdownをコピー
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<ShareIcon />}
              onClick={handleSendToSlack}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
              }}
            >
              Slackに送信
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSummary}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
              }}
            >
              ダウンロード: .md
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {isGeneratingSummary ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 3 }}>
                会議サマリを生成中...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                しばらくお待ちください
              </Typography>
            </CardContent>
          </Card>
         ) : summary ? (
           <Box>
             {/* D-2: 要約本文 */}
             <Card sx={{ mb: 3 }}>
               <CardContent>
                 <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                   要約本文
                 </Typography>
                 <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                   {summary.overallSummary}
                 </Typography>
                 
                 <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                   重要論点：
                 </Typography>
                 <List>
                   {summary.keyPoints.map((point: string, index: number) => (
                     <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                       <ListItemText 
                         primary={`・${point}`}
                         sx={{ "& .MuiListItemText-primary": { fontSize: "0.95rem" } }}
                       />
                     </ListItem>
                   ))}
                 </List>
               </CardContent>
             </Card>

            <Grid container spacing={3}>
               {/* D-3: 決定事項 */}
              <Grid item xs={12}>
                 <Card>
                   <CardContent>
                     <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                       決定
                     </Typography>
                     <List>
                       {summary.decisions.map((decision: any, index: number) => (
                         <ListItem key={index} sx={{ px: 0, py: 1 }}>
                           <ListItemIcon>
                             <CheckCircleIcon color="success" />
                           </ListItemIcon>
                           <ListItemText 
                             primary={`・${decision.description}`}
                             secondary={`承認：${decision.approver}／決定時刻 ${decision.decidedAt}`}
                           />
                         </ListItem>
                       ))}
                     </List>
                   </CardContent>
                 </Card>
               </Grid>

               {/* D-4: 未決事項（提案付き） */}
              <Grid item xs={12}>
                 <Card>
                   <CardContent>
                     <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                       未決（提案付き）
                     </Typography>
                     <List>
                       {summary.unresolved.map((item: any, index: number) => (
                         <ListItem key={index} sx={{ px: 0, py: 1 }}>
                           <ListItemIcon>
                             <WarningIcon color="warning" />
                           </ListItemIcon>
                           <ListItemText 
                             primary={`・${item.topic}`}
                             secondary={
                               <Box>
                                 <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                   不足：{item.missingInfo}
                                 </Typography>
                                 <Typography variant="body2" color="primary">
                                   次の一手：{item.nextAction}
                                 </Typography>
                               </Box>
                             }
                           />
                         </ListItem>
                       ))}
                     </List>
                   </CardContent>
                 </Card>
               </Grid>

               {/* D-5: アクションアイテム */}
              <Grid item xs={12}>
                 <Card>
                   <CardContent>
                     <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                       アクション
                     </Typography>
                     <List>
                       {summary.actions.map((action: any, index: number) => (
                         <ListItem key={index} sx={{ px: 0, py: 1 }}>
                           <ListItemIcon>
                             <AssignmentIcon color="primary" />
                           </ListItemIcon>
                           <ListItemText 
                             primary={`・${action.task}`}
                             secondary={`・${action.assignee}：${action.task}（期限：${action.dueDate}）`}
                           />
                         </ListItem>
                       ))}
                     </List>
                   </CardContent>
                 </Card>
               </Grid>

               {/* D-6: Parking Lot */}
              <Grid item xs={12}>
                 <Card>
                   <CardContent>
                     <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                       Parking Lot
                     </Typography>
                     <List>
                       {summary.parkingLot.map((item: string, index: number) => (
                         <ListItem key={index} sx={{ px: 0, py: 1 }}>
                           <ListItemIcon>
                             <LocalParkingIcon color="action" />
                           </ListItemIcon>
                           <ListItemText primary={`・${item}`} />
                         </ListItem>
                       ))}
                     </List>
                   </CardContent>
                 </Card>
               </Grid>
             </Grid>
           </Box>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="error">
                サマリの生成に失敗しました
              </Typography>
              <Button
                variant="contained"
                onClick={generateSummary}
                sx={{ mt: 2 }}
              >
                再試行
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default MeetingSummaryPage;