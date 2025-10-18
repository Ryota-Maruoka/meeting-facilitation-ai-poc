"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { DeviationAlert } from "@/lib/types";

type UseDeviationDetectionProps = {
  meetingId: string;
  transcripts: Array<{
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
  }>;
  isMeetingStarted: boolean;
};

type UseDeviationDetectionReturn = {
  currentAlert: DeviationAlert | null;
  isCheckingDeviation: boolean;
  consecutiveDeviations: number;
  checkDeviation: () => Promise<void>;
  handleMarkAsRelated: () => void;
  handleReturnToAgenda: () => void;
  handleAddToParkingLot: (topic: string) => void;
  handleIgnoreDeviation: () => void;
};

/**
 * 脱線検知機能を管理するカスタムフック
 * 
 * 文字起こしデータを監視し、自動的に脱線検知を実行する
 * 連続検知ロジックで誤検知を防ぐ
 */
export const useDeviationDetection = ({
  meetingId,
  transcripts,
  isMeetingStarted,
}: UseDeviationDetectionProps): UseDeviationDetectionReturn => {
  const [currentAlert, setCurrentAlert] = useState<DeviationAlert | null>(null);
  const [isCheckingDeviation, setIsCheckingDeviation] = useState(false);
  const [consecutiveDeviations, setConsecutiveDeviations] = useState(0);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);

  // 脱線検知を実行
  const checkDeviation = useCallback(async () => {
    if (isCheckingDeviation || !isMeetingStarted) return;
    
    setIsCheckingDeviation(true);
    try {
      console.log("🔍 脱線検知を実行中...", { meetingId, transcriptCount: transcripts.length });
      const deviationResult = await apiClient.checkDeviation(meetingId);
      
      // チェック済み数を更新
      setLastCheckedCount(transcripts.length);
      
      if (deviationResult.is_deviation) {
        console.log("⚠️ 脱線を検知:", deviationResult);
        setConsecutiveDeviations(prev => prev + 1);
        
        // 連続して2回以上脱線が検知された場合のみアラートを表示
        if (consecutiveDeviations >= 1) {
          setCurrentAlert(deviationResult);
        }
      } else {
        console.log("✅ アジェンダに沿った発話:", deviationResult);
        setConsecutiveDeviations(0); // リセット
      }
    } catch (error) {
      console.error("❌ 脱線検知エラー:", error);
      // エラーの場合もチェック済みとしてカウント
      setLastCheckedCount(transcripts.length);
    } finally {
      setIsCheckingDeviation(false);
    }
  }, [meetingId, transcripts.length, isMeetingStarted, isCheckingDeviation, consecutiveDeviations]);

  // 文字起こし結果が3つ以上になったら脱線検知を実行
  useEffect(() => {
    if (!isMeetingStarted) return;
    
    // 3つ以上溜まっていて、かつ前回チェック時よりも増えている場合
    if (transcripts.length >= 3 && transcripts.length > lastCheckedCount) {
      console.log("📊 脱線検知トリガー:", { 
        transcriptCount: transcripts.length, 
        lastChecked: lastCheckedCount 
      });
      checkDeviation();
    }
  }, [transcripts.length, lastCheckedCount, isMeetingStarted, checkDeviation]);

  // 脱線アラートのアクション処理
  const handleMarkAsRelated = useCallback(() => {
    console.log("アジェンダに関連しているとマーク");
    setCurrentAlert(null);
    setConsecutiveDeviations(0); // リセット
    // TODO: AIの学習データに「関連」として記録
  }, []);

  const handleReturnToAgenda = useCallback(() => {
    console.log("軌道修正して議題に戻す");
    setCurrentAlert(null);
    setConsecutiveDeviations(0); // リセット
    // TODO: 実際の議題に戻す処理を実装
  }, []);

  const handleAddToParkingLot = useCallback((topic: string) => {
    console.log("保留事項に追加:", topic);
    setCurrentAlert(null);
    setConsecutiveDeviations(0); // リセット
    // TODO: 保留事項に追加する処理を実装
  }, []);

  const handleIgnoreDeviation = useCallback(() => {
    console.log("脱線を無視");
    setCurrentAlert(null);
    setConsecutiveDeviations(0); // リセット
  }, []);

  return {
    currentAlert,
    isCheckingDeviation,
    consecutiveDeviations,
    checkDeviation,
    handleMarkAsRelated,
    handleReturnToAgenda,
    handleAddToParkingLot,
    handleIgnoreDeviation,
  };
};
