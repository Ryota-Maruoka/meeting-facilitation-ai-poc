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
  alerts: DeviationAlert[];
  isCheckingDeviation: boolean;
  consecutiveDeviations: number;
  checkDeviation: () => Promise<void>;
  handleMarkAsRelated: (alertId: string) => void;
  handleReturnToAgenda: (alertId: string) => void;
  handleAddToParkingLot: (alertId: string, title: string) => void;
  handleIgnoreDeviation: (alertId: string) => void;
  clearAllAlerts: () => void;
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
  const [alerts, setAlerts] = useState<DeviationAlert[]>([]);
  const [isCheckingDeviation, setIsCheckingDeviation] = useState(false);
  const [consecutiveDeviations, setConsecutiveDeviations] = useState(0);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number>(-1);

  // 脱線検知を実行
  const checkDeviation = useCallback(async () => {
    if (isCheckingDeviation || !isMeetingStarted) return;
    
    // チャンクが存在するかチェック
    if (transcripts.length === 0) {
      console.log("⏭️ チャンクがありません（スキップ）");
      return;
    }
    
    // 最新チャンクのインデックスを取得
    const currentLatestIndex = transcripts.length - 1;
    
    // 既にチェック済みの場合はスキップ（インデックスベースで比較）
    if (currentLatestIndex <= lastCheckedIndex) {
      console.log("⏭️ 既にチェック済みのチャンクです（スキップ）", {
        currentIndex: currentLatestIndex,
        lastCheckedIndex,
      });
      return;
    }
    
    setIsCheckingDeviation(true);
    try {
      console.log("🔍 脱線検知を実行中...", {
        meetingId,
        transcriptCount: transcripts.length,
        currentIndex: currentLatestIndex,
        lastCheckedIndex,
        newChunksCount: currentLatestIndex - lastCheckedIndex,
      });
      const deviationResult = await apiClient.checkDeviation(meetingId);
      
      // バックエンドレスポンスを詳細にログ出力（デバッグ用）
      console.log("📥 バックエンドレスポンス:", {
        is_deviation: deviationResult.is_deviation,
        similarity: deviationResult.similarity,
        confidence: deviationResult.confidence,
        best_agenda: deviationResult.best_agenda,
        message: deviationResult.message,
        recent_text: deviationResult.recent_text?.substring(0, 100),
      });
      
      // チェック済み情報を更新
      const latestIndex = transcripts.length - 1;
      setLastCheckedIndex(latestIndex);
      setLastCheckedCount(transcripts.length);
      
      if (deviationResult.is_deviation) {
        console.log("⚠️ 脱線を検知:", deviationResult);
        console.log(`📊 類似度: ${deviationResult.similarity.toFixed(2)}`);
        console.log(`💬 検知内容: "${deviationResult.recent_text}"`);

/* 
        // TODO: 脱線検知の頻度が多い場合は、連続脱線回数判定を追加
        console.log(`📊 連続脱線回数: ${consecutiveDeviations + 1}回`);
        setConsecutiveDeviations(prev => prev + 1);

        // 連続して2回以上脱線が検知された場合のみアラートを追加
        if (consecutiveDeviations >= 1) {
          const newAlert: DeviationAlert = {
            ...deviationResult,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          setAlerts(prev => [...prev, newAlert]);
          console.log("🚨 アラートを追加:", newAlert.id);
        } else {
          console.log("⏳ 連続脱線回数不足（アラートを追加しません）");
        }
 */
        // バックエンドで脱線と判定されたら即座にアラートを追加
        const newAlert: DeviationAlert = {
          ...deviationResult,
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };
        setAlerts(prev => [...prev, newAlert]);
        console.log("🚨 アラートを追加:", newAlert.id);
        
        // 連続脱線カウントは記録のみ
        setConsecutiveDeviations(prev => prev + 1);
      } else {
        console.log("✅ アジェンダに沿った発話");
        console.log(`💡 類似度: ${deviationResult.similarity.toFixed(2)}`);
        setConsecutiveDeviations(0); // リセット
      }
    } catch (error) {
      console.error("❌ 脱線検知エラー:", error);
      // エラーの場合もチェック済みとしてカウント
      const latestIndex = transcripts.length - 1;
      if (latestIndex >= 0) {
        setLastCheckedIndex(latestIndex);
      }
      setLastCheckedCount(transcripts.length);
    } finally {
      setIsCheckingDeviation(false);
    }
  }, [meetingId, transcripts, isMeetingStarted, isCheckingDeviation, consecutiveDeviations, lastCheckedIndex]);

  // 新しいチャンクが追加されたら脱線検知を実行
  useEffect(() => {
    if (!isMeetingStarted) return;
    if (transcripts.length === 0) return;
    
    // 最新チャンクのインデックスを取得
    const currentLatestIndex = transcripts.length - 1;
    
    // 新しいチャンクが追加された場合のみ実行
    const hasNewChunk = currentLatestIndex > lastCheckedIndex;
    
    if (hasNewChunk) {
      console.log("📊 脱線検知トリガー:", {
        transcriptCount: transcripts.length,
        currentIndex: currentLatestIndex,
        lastCheckedIndex,
      });
      checkDeviation();
    }
  }, [transcripts.length, lastCheckedIndex, isMeetingStarted, checkDeviation]);

  // 脱線アラートのアクション処理
  const handleMarkAsRelated = useCallback((alertId: string) => {
    console.log("✅ アジェンダに関連しているとマーク:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
    // TODO: AIの学習データに「関連」として記録
  }, []);

  const handleReturnToAgenda = useCallback((alertId: string) => {
    console.log("🔄 軌道修正して議題に戻す:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
    // TODO: 実際の議題に戻す処理を実装
  }, []);

  const handleAddToParkingLot = useCallback((alertId: string, title: string) => {
    console.log("🚗 保留事項に追加:", alertId, title);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
  }, []);

  const handleIgnoreDeviation = useCallback((alertId: string) => {
    console.log("🚫 脱線を無視:", alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setConsecutiveDeviations(0); // リセット
  }, []);

  const clearAllAlerts = useCallback(() => {
    console.log("🗑️ すべてのアラートをクリア");
    setAlerts([]);
    setConsecutiveDeviations(0);
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
  };
};
