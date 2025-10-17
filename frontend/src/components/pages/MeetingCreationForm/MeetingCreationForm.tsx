"use client";

import { FC, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Stack,
  Avatar,
  InputAdornment,
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  RecordVoiceOver as RecordIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useMeetings } from "@/hooks/useMeetings";
import type { MeetingCreate, AgendaItemCreate } from "@/lib/types";
import { MEETING_TEMPLATES } from "@/lib/constants";

type MeetingCreationFormProps = {
  onSubmit: (data: MeetingCreate) => Promise<{ id: string }>;
  onSuccess: (meetingId: string) => void;
};

/**
 * ページレベルコンポーネント: 会議作成フォーム
 * 
 * 会議の基本情報とアジェンダを入力するフォーム
 * 
 * @param props - コンポーネントのプロパティ
 * @returns 会議作成フォームの JSX 要素
 */
const MeetingCreationForm: FC<MeetingCreationFormProps> = ({
  onSubmit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<MeetingCreate>({
    title: "",
    purpose: "",
    expectedOutcome: "",
    participants: [],
    agenda: [],
  });

  const [agendaItems, setAgendaItems] = useState<AgendaItemCreate[]>([
    {
      title: "",
      duration: 15,
      expectedOutcome: "",
    },
  ]);

  const [participantInput, setParticipantInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームデータの更新
  const handleInputChange = (field: keyof MeetingCreate, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 参加者の追加
  const handleAddParticipant = () => {
    if (participantInput.trim() && !formData.participants.includes(participantInput.trim())) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participantInput.trim()],
      }));
      setParticipantInput("");
    }
  };

  // 参加者の削除
  const handleRemoveParticipant = (participant: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== participant),
    }));
  };

  // アジェンダ項目の更新
  const handleAgendaItemChange = (index: number, field: keyof AgendaItemCreate, value: string | number) => {
    setAgendaItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // アジェンダ項目の追加
  const handleAddAgendaItem = () => {
    setAgendaItems(prev => [...prev, {
      title: "",
      duration: 15,
      expectedOutcome: "",
    }]);
  };

  // アジェンダ項目の削除
  const handleRemoveAgendaItem = (index: number) => {
    if (agendaItems.length > 1) {
      setAgendaItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // テンプレートの適用
  const handleApplyTemplate = (template: string) => {
    setFormData(prev => ({
      ...prev,
      title: template,
      purpose: `${template}の目的を明確にし、必要な決定事項を整理する`,
      expectedOutcome: `${template}に関する決定事項と次のアクションを明確にする`,
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // バリデーション
      if (!formData.title.trim()) {
        throw new Error("会議タイトルを入力してください");
      }
      if (!formData.purpose.trim()) {
        throw new Error("会議の目的を入力してください");
      }
      if (!formData.expectedOutcome.trim()) {
        throw new Error("期待する成果物を入力してください");
      }

      // アジェンダ項目をフィルタリング（空の項目を除外）
      const validAgendaItems = agendaItems.filter(item => 
        item.title.trim() && item.expectedOutcome.trim()
      );

      // 会議作成データにアジェンダを含める
      const meetingData = {
        ...formData,
        agenda: validAgendaItems.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          status: "pending" as const,
        })),
      };

      // 会議作成
      const meeting = await onSubmit(meetingData);

      onSuccess(meeting.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create meeting:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDuration = agendaItems.reduce((sum, item) => sum + item.duration, 0);
  const steps = ["基本情報", "参加者", "アジェンダ", "確認"];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto" }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          新しい会議を作成
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AIが会議をサポートし、より効率的な議論を実現します
        </Typography>
      </Box>

      {/* ステッパー */}
      <Stepper activeStep={0} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* 会議メタ情報 */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
              <DescriptionIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              会議の基本情報
            </Typography>
          </Box>
          
          <Stack spacing={3}>
            <TextField
              label="会議タイトル"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              fullWidth
              required
              placeholder="例: 要件すり合わせ"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="会議の目的"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
              placeholder="何を決めたいか1行で"
              helperText="会議の目的を明確にすることで、AIがより適切なサポートを提供できます"
            />
            
            <TextField
              label="期待する成果物"
              value={formData.expectedOutcome}
              onChange={(e) => handleInputChange("expectedOutcome", e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
              placeholder="決定文の雛形（何を/なぜ/誰が/いつまで）"
              helperText="期待する成果物を明確にすることで、会議の方向性を定めやすくなります"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* 参加者セクション */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
              <GroupIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              参加者
            </Typography>
          </Box>
          
          <Stack spacing={3}>
            <Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  placeholder="@tanaka @suzuki @..."
                  fullWidth
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddParticipant}
                  disabled={!participantInput.trim()}
                  startIcon={<AddIcon />}
                >
                  追加
                </Button>
              </Box>
              
              {formData.participants.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.participants.map((participant) => (
                    <Chip
                      key={participant}
                      label={participant}
                      onDelete={() => handleRemoveParticipant(participant)}
                      color="primary"
                      variant="outlined"
                      avatar={<Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>{participant[0]}</Avatar>}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            {/* <FormControlLabel
              control={
                <Checkbox
                  checked={formData.recordingConsent}
                  onChange={(e) => handleInputChange("recordingConsent", e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <RecordIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    全員に録音同意を取得する
                  </Typography>
                </Box>
              }
            /> */}
          </Stack>
        </CardContent>
      </Card>

      {/* テンプレート選択 */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            テンプレートから選択
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            よく使用される会議パターンから選択して、素早く会議をセットアップできます
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {MEETING_TEMPLATES.map((template) => (
              <Chip
                key={template}
                label={template}
                onClick={() => handleApplyTemplate(template)}
                variant="outlined"
                clickable
                sx={{
                  py: 2,
                  px: 1,
                  fontSize: "0.875rem",
                  "&:hover": {
                    bgcolor: "primary.50",
                    borderColor: "primary.main",
                  },
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* アジェンダエリア */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
              <ScheduleIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                アジェンダ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                会議の流れを整理して、効率的な議論を実現します
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddAgendaItem}
              sx={{ ml: 2 }}
            >
              議題を追加
            </Button>
          </Box>
          
          <Stack spacing={3}>
            {agendaItems.map((item, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  p: 3, 
                  border: 1, 
                  borderColor: "grey.200", 
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 1,
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", mr: 2, fontSize: "0.875rem" }}>
                      {index + 1}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      議題 {index + 1}
                    </Typography>
                  </Box>
                  {agendaItems.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveAgendaItem(index)}
                      color="error"
                      size="small"
                      sx={{ 
                        bgcolor: "error.50",
                        "&:hover": { bgcolor: "error.100" }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                
                <Stack spacing={2}>
                  <TextField
                    label="タイトル"
                    value={item.title}
                    onChange={(e) => handleAgendaItemChange(index, "title", e.target.value)}
                    fullWidth
                    required
                    placeholder="議題のタイトルを入力"
                  />
                  
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="時間（分）"
                      type="number"
                      value={item.duration}
                      onChange={(e) => handleAgendaItemChange(index, "duration", parseInt(e.target.value) || 0)}
                      sx={{ width: 140 }}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      label="期待成果"
                      value={item.expectedOutcome}
                      onChange={(e) => handleAgendaItemChange(index, "expectedOutcome", e.target.value)}
                      fullWidth
                      required
                      placeholder="この議題で何を決めたいか"
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
          
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mt: 3,
            p: 2,
            bgcolor: "primary.50",
            borderRadius: 2,
            border: 1,
            borderColor: "primary.200",
          }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                合計時間: {totalDuration}分
              </Typography>
            </Box>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                // カレンダーから読込機能（実装予定）
                console.log("カレンダーから読込");
              }}
              sx={{ color: "primary.main" }}
            >
              カレンダーから読込
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* 送信ボタン */}
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              // 下書き保存機能（実装予定）
              console.log("下書き保存");
            }}
            sx={{ px: 4 }}
          >
            下書き保存
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{ px: 6 }}
          >
            {isSubmitting ? "作成中..." : "会議を開始"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default MeetingCreationForm;
