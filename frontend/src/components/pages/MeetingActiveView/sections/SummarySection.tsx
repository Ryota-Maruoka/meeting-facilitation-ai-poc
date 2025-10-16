"use client";

import { FC } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Assignment as AssignmentIcon } from "@mui/icons-material";
import MiniSummaryArea from "@/components/sections/MiniSummaryArea";

type SummarySectionProps = {
  meetingId: string;
};

/**
 * セクションコンポーネント: ミニ要約
 *
 * 会議中のミニ要約を表示するセクション
 * 決定・未決・アクションをリアルタイムで表示
 */
const SummarySection: FC<SummarySectionProps> = ({ meetingId }) => {
  return (
    <Card sx={{ height: "500px" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <AssignmentIcon color="primary" />
          ミニ要約
        </Typography>
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <MiniSummaryArea meetingId={meetingId} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummarySection;

