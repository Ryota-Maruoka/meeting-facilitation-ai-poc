"use client";

import { FC } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import type { Transcript } from "@/lib/types";
import AlertOperationsArea from "@/components/sections/AlertOperationsArea";

type AlertSectionProps = {
  meetingId: string;
  transcripts: Transcript[];
};

/**
 * セクションコンポーネント: アラート・操作
 *
 * 脱線検知アラートとParking Lot操作を表示するセクション
 * 会議の進行を監視し、必要に応じて警告を表示
 */
const AlertSection: FC<AlertSectionProps> = ({ meetingId, transcripts }) => {
  return (
    <Card sx={{ height: "500px" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <WarningIcon color="primary" />
          アラート・操作
        </Typography>
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <AlertOperationsArea meetingId={meetingId} transcripts={transcripts} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertSection;

