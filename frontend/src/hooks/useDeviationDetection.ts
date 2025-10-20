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
  alerts: DeviationAlert[]; // 複数のアラートを管理
  isCheckingDeviation: boolean;
  consecutiveDeviations: number;
  checkDeviation: () => Promise<void>;
  handleMarkAsRelated: (alertId: string) => void;
  handleReturnToAgenda: (alertId: string) => void;
  handleAddToParkingLot: (alertId: string, topic: string) => void;
  handleIgnoreDeviation: (alertId: string) => void;
  clearAllAlerts: () => void;
  addTestAlert: (override?: Partial<DeviationAlert>) => void; // 🧪 テスト用アラート追加
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
  const [alerts, setAlerts] = useState<DeviationAlert[]>([]); // 複数のアラートを管理
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
        
        // TODO: 何回以上か検討
        // 連続して2回以上脱線が検知された場合のみアラートを追加
        if (consecutiveDeviations >= 1) {
          const newAlert: DeviationAlert = {
            ...deviationResult,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          setAlerts(prev => [...prev, newAlert]);
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
  const handleMarkAsRelated = useCallback((alertId: string) => {
    console.log("アジェンダに関連しているとマーク:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
    // TODO: AIの学習データに「関連」として記録
  }, []);

  const handleReturnToAgenda = useCallback((alertId: string) => {
    console.log("軌道修正して議題に戻す:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
    // TODO: 実際の議題に戻す処理を実装
  }, []);

  const handleAddToParkingLot = useCallback((alertId: string, topic: string) => {
    console.log("保留事項に追加:", alertId, topic);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
    // TODO: 保留事項に追加する処理を実装
  }, []);

  const handleIgnoreDeviation = useCallback((alertId: string) => {
    console.log("脱線を無視:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
  }, []);

  const clearAllAlerts = useCallback(() => {
    console.log("すべてのアラートをクリア");
    setAlerts([]);
    setConsecutiveDeviations(0);
  }, []);

  // 🧪 テスト用: ダミーの脱線アラートを手動で追加
  const addTestAlert = useCallback((override?: Partial<DeviationAlert>) => {
    const now = new Date().toISOString();
    const base: DeviationAlert = {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      is_deviation: true,
      confidence: 0.87,
      similarity: 0.22,
      best_agenda: "JWT方式の検討",
      message: "直近の会話がアジェンダから逸脱している可能性があります",
      suggestedTopics: ["認証方式の比較に戻る", "セキュリティ要件の確認"],
      recent_text: "昨日の野球の試合が…",
      created_at: now,
      timestamp: now,
    };
    const alert = { ...base, ...override, id: base.id };
    setAlerts(prev => [...prev, alert]);
  }, []);

  return {
    alerts,
    isCheckingDeviation,
    consecutiveDeviations,
    checkDeviation,
    handleMarkAsRelated,
    handleReturnToAgenda,
    handleAddToParkingLot,
    handleIgnoreDeviation,
    clearAllAlerts,
    addTestAlert,
  };
};
