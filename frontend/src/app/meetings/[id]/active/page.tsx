"use client";

/**
 * ========================================
 * ページ: 会議進行中
 * ========================================
 *
 * URL: /meetings/[id]/active
 *
 * このページについて:
 * - 進行中の会議をリアルタイムで管理・ファシリテーション
 * - 3カラムレイアウト：文字起こし / 要約 / アラート＆保留事項
 *
 * 主な機能:
 * - アジェンダ進捗バー（各議題の進行状況を可視化）
 * - リアルタイム文字起こし表示（発言者・時刻付き）
 * - AI要約の自動生成・表示（3分ごと更新）
 * - 脱線検知アラート表示
 * - アラート対応（無視 / 保留事項に退避）
 * - 保留事項リスト表示
 * - 会議終了 → サマリー画面へ遷移
 * - 一覧に戻るボタン
 *
 * リアルタイム機能:
 * - WebSocketで音声文字起こしを受信
 * - 定期的にAI要約を生成
 * - 脱線検知アラートをリアルタイム表示
 *
 * 関連ファイル:
 * - features/meeting-active/components/* - 会議進行中関連コンポーネント
 * - lib/types.ts - 型定義
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, PARKING_LOT_LABEL } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import LiveTranscriptArea, { LiveTranscriptAreaHandle } from "@/components/sections/LiveTranscriptArea/LiveTranscriptArea";
import DeviationAlert from "@/components/sections/DeviationAlert";
import { useDeviationDetection } from "@/hooks/useDeviationDetection";
import { apiClient } from "@/lib/api";
import { formatElapsedHMSFromIso } from "@/lib/time";
import type { Meeting } from "@/lib/types";

export default function MeetingActivePage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // 会議データをAPIから取得
  const [meetingData, setMeetingData] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 会議開始状態
  const [isMeetingStarted, setIsMeetingStarted] = useState<boolean>(false);
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // 録音開始状態（文字起こしデータが存在するかどうかの指標）
  const [isRecordingStarted, setIsRecordingStarted] = useState<boolean>(false);

  // -----------------------------
  // ステート
  // -----------------------------
  // 文字起こしデータ（LiveTranscriptAreaから受信）
  const [transcripts, setTranscripts] = useState<Array<{
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
  }>>([]);

  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  const [parkingLot, setParkingLot] = useState<string[]>([]);
  const [backModalOpen, setBackModalOpen] = useState<boolean>(false);
  const [endModalOpen, setEndModalOpen] = useState<boolean>(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState<boolean>(false);
  const [isAddingToParkingLot, setIsAddingToParkingLot] = useState<boolean>(false);
  const transcriptRef = useRef<LiveTranscriptAreaHandle | null>(null);

  // トースト通知
  const { toasts, showSuccess, removeToast } = useToast();

  // 脱線検知機能
  const {
    alerts,
    isCheckingDeviation,
    consecutiveDeviations,
    checkDeviation,
    handleMarkAsRelated,
    handleReturnToAgenda,
    handleAddToParkingLot,
    handleIgnoreDeviation,
    clearAllAlerts,
  } = useDeviationDetection({
    meetingId,
    transcripts,
    isMeetingStarted,
  });

  // 初期化：APIから会議データを取得
  useEffect(() => {
    if (!meetingId) return;

    // 画面遷移時に前回の表示を即座に消す（取り違え防止）
    setMeetingData(null);
    setParkingLot([]);
    setTranscripts([]);
    setIsRecordingStarted(false);

    let isActive = true;
    const currentId = meetingId;

    const fetchMeetingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const meeting = await apiClient.getMeeting(currentId);
        if (!isActive) return;
        setMeetingData(meeting);

        // 保留事項も取得
        const parkingItems = await apiClient.getParkingItems(currentId);
        if (!isActive) return;
        setParkingLot(parkingItems.map((item) => item.title));
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to fetch meeting data:", err);
        setError(err instanceof Error ? err.message : "会議データの取得に失敗しました");
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    fetchMeetingData();

    return () => {
      // 直前のリクエスト結果を無視（競合防止）
      isActive = false;
    };
  }, [meetingId]);

  // 経過時間の更新（1秒ごと）
  useEffect(() => {
    if (!meetingStartTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - meetingStartTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [meetingStartTime]);

  // 3分ごとに要約を取得・生成
  useEffect(() => {
    if (!isMeetingStarted || !isRecordingStarted) return;

    // 要約を生成・取得する関数
    const fetchSummary = async () => {
      try {
        // まず文字起こしデータの存在を確認
        const transcripts = await apiClient.getTranscripts(meetingId);
        if (!transcripts || transcripts.length === 0) {
          console.log("文字起こしデータがありません。音声を録音してください。");
          return;
        }

        console.log("要約を生成中...");
        setIsGeneratingSummary(true);

        // 要約を生成
        await apiClient.generateSummary(meetingId);

        // 生成された要約を取得
        const summaryData = await apiClient.getSummary(meetingId);

        if (summaryData && summaryData.summary) {
          setSummary(summaryData.summary);
          console.log("要約を更新しました");
        }
      } catch (error) {
        console.error("要約の取得に失敗しました:", error);

        // エラーメッセージをユーザーに表示
        if (error instanceof Error) {
          if (error.message.includes("文字起こしデータが見つかりません")) {
            console.log("文字起こしデータがありません。音声を録音してください。");
          } else if (error.message.includes("文字起こしテキストが空です")) {
            console.log("文字起こしテキストが空です。音声を録音してください。");
          } else {
            console.log("要約生成中にエラーが発生しました:", error.message);
          }
        }
      } finally {
        setIsGeneratingSummary(false);
      }
    };

    // 録音開始後、十分なデータが蓄積されるまで少し待機してから要約生成を試行
    // 初回は3分後に実行（録音開始後の十分なデータ蓄積を待つ）
    const initialTimeout = setTimeout(() => {
      fetchSummary();
    }, 3 * 60 * 1000); // 3分後

    // 3分ごとに要約を生成・取得
    const summaryInterval = setInterval(fetchSummary, 3 * 60 * 1000); // 3分 = 180秒 = 180,000ミリ秒

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(summaryInterval);
    };
  }, [isMeetingStarted, isRecordingStarted, meetingId]);

  // 経過時間をフォーマット
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 開始時刻をフォーマット
  const formatStartTime = (date: Date | null): string => {
    if (!date) return "--:--";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 各アジェンダの経過時間を計算
  const calculateAgendaProgress = () => {
    if (!meetingData?.agenda || meetingData.agenda.length === 0) {
      return [];
    }

    const elapsedMinutes = elapsedSeconds / 60;
    let remainingMinutes = elapsedMinutes;

    return meetingData.agenda.map((item) => {
      const completed = Math.min(remainingMinutes, item.duration);
      remainingMinutes = Math.max(0, remainingMinutes - item.duration);

      return {
        title: item.title,
        duration: item.duration,
        completed: completed,
        completedMinutes: Math.floor(completed),
      };
    });
  };

  const agendaProgress = calculateAgendaProgress();

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleDeviationMarkAsRelated = (alertId: string) => {
    handleMarkAsRelated(alertId);
    showSuccess("アジェンダに関連しているとマークしました");
  };

  const handleDeviationReturnToAgenda = (alertId: string) => {
    handleReturnToAgenda(alertId);
    showSuccess("軌道修正して議題に戻しました");
  };

  const handleDeviationAddToParkingLot = async (alertId: string, content: string, addToNextAgenda: boolean = false) => {
    // ローディング開始
    setIsAddingToParkingLot(true);
    showSuccess("保留事項に追加中...");
    
    try {
      await apiClient.addParkingItem(meetingId, content, addToNextAgenda);
      
      // 保留事項一覧を再取得（AI生成されたタイトルを含む）
      const parkingItems = await apiClient.getParkingItems(meetingId);
      const latestTitle = parkingItems[parkingItems.length - 1]?.title || "";
      
      console.log("🤖 AI生成されたタイトル:", latestTitle);
      
      // AI生成されたタイトルを渡す
      handleAddToParkingLot(alertId, latestTitle);
      
      setParkingLot(parkingItems.map(item => item.title));
      
      showSuccess("保留事項に追加しました");
    } catch (error) {
      console.error("保留事項の追加に失敗:", error);
      showSuccess("保留事項の追加に失敗しました");
    } finally {
      // ローディング終了
      setIsAddingToParkingLot(false);
    }
  };

  const handleDeviationIgnore = (alertId: string) => {
    handleIgnoreDeviation(alertId);
    showSuccess("脱線アラートを無視しました");
  };

  const handleEndMeetingClick = () => {
    setEndModalOpen(true);
  };

  const handleStartMeeting = async () => {
    try {
      // 会議開始APIを呼び出し
      await apiClient.startMeeting(meetingId);

      // 会議開始時刻を記録
      const now = new Date();
      setMeetingStartTime(now);
      setIsMeetingStarted(true);
      
      // 録音開始状態をリセット（文字起こしデータが蓄積されるまで待機）
      setIsRecordingStarted(false);
    } catch (error) {
      console.error("Failed to start meeting:", error);
      showSuccess("会議の開始に失敗しました");
    }
  };

  const handleEndMeetingConfirm = async () => {
    console.log("会議終了:", meetingId);

    // タイマーを停止（経過時間の表示を固定）
    setIsMeetingStarted(false);

    // 会議終了時に会議レポート用のデータを保存
    if (meetingData && meetingStartTime) {
      // 経過時間を計算（分単位）
      const durationMinutes = Math.floor(elapsedSeconds / 60);

      const meetingSummaryData = {
        title: meetingData.title,
        date: meetingData.meetingDate || new Date().toISOString().split('T')[0],
        participants: meetingData.participants.join("、"),
        duration: `${durationMinutes}分`,
        startTime: formatStartTime(meetingStartTime),
      };

      sessionStorage.setItem("meetingSummary", JSON.stringify(meetingSummaryData));
    }

    // ローディング表示開始
    setIsEndingMeeting(true);
    setEndModalOpen(false);

    try {
      // 1) 録音停止＆最後のチャンク送信・文字起こし完了まで待機
      if (transcriptRef.current) {
        await transcriptRef.current.stopAndFlush();
      }

      // 2) 会議終了API呼び出し（バックグラウンドで要約生成が開始される）
      await apiClient.endMeeting(meetingId);

      // 3) すぐにサマリー画面へ遷移（要約生成を待たない）
      // サマリー画面側で要約の読み込み状態を表示する
    } catch (error) {
      console.error("会議終了処理に失敗:", error);
    } finally {
      // サマリ画面へ遷移
      router.push(`/meetings/${meetingId}/summary`);
    }
  };

  const handleEndModalClose = () => {
    setEndModalOpen(false);
  };

  const handleBackToListClick = () => {
    setBackModalOpen(true);
  };

  const handleBackConfirm = () => {
    setBackModalOpen(false);
    router.push("/");
  };

  const handleBackModalClose = () => {
    setBackModalOpen(false);
  };

  // LiveTranscriptAreaからの文字起こしデータを受信
  const handleTranscriptsUpdate = (newTranscripts: Array<{
    id: string;
    timestamp: string;
    text: string;
    speaker?: string;
  }>) => {
    // LiveTranscriptAreaの形式を会議中画面の形式に変換
    const convertedTranscripts = newTranscripts.map(t => ({
      id: t.id,
      speaker: t.speaker || "話者不明",
      text: t.text,
      timestamp: t.timestamp,
    }));
    setTranscripts(convertedTranscripts);
    
    // 文字起こしデータが存在する場合、録音開始状態を更新
    if (newTranscripts.length > 0 && !isRecordingStarted) {
      setIsRecordingStarted(true);
      console.log("録音開始を検出しました。要約生成を開始します。");
    }
  };

  // -----------------------------
  // レンダリング
  // -----------------------------
  
  // ローディング状態
  if (isLoading) {
    return (
      <div className="page">
        <style suppressHydrationWarning>{commonStyles}</style>
        <div className="page-container">
          <div className="meeting-header">
            <div className="meeting-title">会議中画面</div>
          </div>
          <div className="body-content">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div>会議データを読み込み中...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="page">
        <style suppressHydrationWarning>{commonStyles}</style>
        <div className="page-container">
          <div className="meeting-header">
            <div className="meeting-title">会議中画面</div>
          </div>
          <div className="body-content">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ color: "red", marginBottom: "1rem" }}>エラー: {error}</div>
              <button className="btn" onClick={() => router.push("/")}>
                一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 会議データがない場合
  if (!meetingData) {
    return (
      <div className="page">
        <style suppressHydrationWarning>{commonStyles}</style>
        <div className="page-container">
          <div className="meeting-header">
            <div className="meeting-title">会議中画面</div>
          </div>
          <div className="body-content">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ marginBottom: "1rem" }}>会議データが見つかりません</div>
              <button className="btn" onClick={() => router.push("/")}>
                一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ height: "100vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
      <style suppressHydrationWarning>{commonStyles}</style>

      <div className="page-container" style={{ display: "flex", flexDirection: "column", minHeight: "100%", overflow: "visible" }}>
        {/* ヘッダー */}
        <div className="meeting-header" style={{ flexShrink: 0 }}>
          <div className="meeting-title">会議中画面</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content" style={{ display: "flex", flexDirection: "column", minHeight: 0, justifyContent: "flex-start" }}>
          {/* 会議情報セクション */}
          <div className="meeting-info-section" style={{ paddingLeft: "24px", paddingRight: "24px", flexShrink: 0 }}>
          <div className="meeting-info" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div className="meeting-info-item">
              <strong>会議名:</strong>
              <span>{meetingData?.title || "読み込み中..."}</span>
            </div>
            <div className="meeting-info-item">
              <strong>開始時刻:</strong>
              <span>{formatStartTime(meetingStartTime)}</span>
            </div>
            <div className="meeting-info-item">
              <strong>経過時間:</strong>
              <span>{formatElapsedTime(elapsedSeconds)}</span>
            </div>
            <div className="meeting-info-item">
              <strong>参加者:</strong>
              <span>{meetingData?.participants.join("、") || "なし"}</span>
            </div>

            {/* 会議開始ボタン（会議開始前のみ表示） */}
            {!isMeetingStarted && (
              <div style={{ marginLeft: "auto" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleStartMeeting}
                  style={{ fontSize: "14px", padding: "8px 24px" }}
                >
                  会議開始
                </button>
              </div>
            )}
          </div>
        </div>

        {/* アジェンダ進捗バー */}
        <div className="agenda-progress-section" style={{ paddingLeft: "24px", paddingRight: "24px", flexShrink: 0 }}>
          <div className="agenda-progress-title">
            <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
            <span>アジェンダ進捗バー</span>
          </div>
          <div className="agenda-progress-list">
            {agendaProgress.length === 0 ? (
              <div className="empty-state">アジェンダが設定されていません</div>
            ) : (
              agendaProgress.map((item, index) => (
                <div key={index} className="agenda-progress-item">
                  <div className="agenda-progress-label">{item.title}</div>
                  <div className="agenda-progress-bar">
                    <div
                      className="agenda-progress-fill"
                      style={{
                        width: `${(item.completed / item.duration) * 100}%`,
                        transition: 'width 1s linear'
                      }}
                    ></div>
                  </div>
                  <div className="agenda-progress-time">
                    {item.completedMinutes}/{item.duration}分
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3カラムレイアウト */}
        <div className="three-column-layout" style={{ 
          height: "600px",
          overflow: "hidden", 
          flexShrink: 0,
          padding: "8px 0" 
        }}>
          {/* 文字起こし（LiveTranscriptArea統合） */}
          <div className="column-section" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="section-header" style={{ flexShrink: 0 }}>
              <span className="material-icons icon-sm">{ICONS.TRANSCRIBE}</span>
              <span>文字起こし</span>
            </div>
            <div className="section-content" style={{ flex: 1, overflow: "hidden", minHeight: 0, padding: 0 }}>
              <LiveTranscriptArea
                ref={transcriptRef}
                meetingId={meetingId}
                onTranscriptsUpdate={handleTranscriptsUpdate}
                autoStart={isMeetingStarted}
              />
            </div>
          </div>

          {/* 要約 */}
          <div className="column-section" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="section-header" style={{ flexShrink: 0 }}>
              <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
              <span>要約</span>
            </div>
            <div className="section-content" style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: "16px" }}>
              {!isRecordingStarted || !isMeetingStarted ? (
                <div style={{ color: "#666", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                  文字起こしが開始されると要約が自動生成されます
                </div>
              ) : isGeneratingSummary ? (
                <div className="loading-box">
                  <div className="spinner"></div>
                  <span>生成中...</span>
                </div>
              ) : (
                <div style={{ lineHeight: 1.8 }}>
                  <ReactMarkdown
                    components={{
                      h2: ({ node, ...props }) => (
                        <>
                          <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '20px 0 16px 0' }} />
                          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }} {...props} />
                        </>
                      ),
                      h3: ({ node, ...props }) => (
                        <>
                          <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '16px 0 12px 0' }} />
                          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#374151' }} {...props} />
                        </>
                      ),
                      p: ({ node, ...props }) => (
                        <p style={{ marginBottom: '12px' }} {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul style={{ marginLeft: '20px', marginBottom: '12px' }} {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li style={{ marginBottom: '6px' }} {...props} />
                      ),
                    }}
                  >
                    {summary || "要約データがありません"}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* アラート・保留事項の統合カラム */}
          <div className="column-section alert-parking-column" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* 脱線検知アラートセクション */}
            <div className="alert-section-inner" style={{ flex: 1.5, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: 0 }}>
              <div className="section-header" style={{ flexShrink: 0, padding: "0 16px" }}>
                <span className="material-icons icon-sm">{ICONS.ALERT}</span>
                <span>脱線検知アラート</span>
                {alerts.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                    ({alerts.length}件)
                  </span>
                )}
                {isCheckingDeviation && (
                  <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                    (検知中...)
                  </span>
                )}
              </div>
              <div className="section-content alerts-container" style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 16px 16px 16px" }}>
                {alerts.length > 0 ? (
                  <div className="alerts-list">
                    {alerts.map((alert) => {
                      const meetingStartIso = meetingStartTime ? meetingStartTime.toISOString() : undefined;
                      const timestamp = formatElapsedHMSFromIso(meetingStartIso, alert.timestamp);
                      return (
                        <div key={alert.id} className="alert-item">
                          <DeviationAlert
                            alert={alert}
                            timestamp={timestamp}
                            onAddToParkingLot={(content, addToNextAgenda) => handleDeviationAddToParkingLot(alert.id, content, addToNextAgenda)}
                            onDismiss={() => handleDeviationIgnore(alert.id)}
                            isLoading={isAddingToParkingLot}
                          />
                        </div>
                      );
                    })}
                    {alerts.length > 3 && (
                      <div className="alerts-clear-all">
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={clearAllAlerts}
                        >
                          すべてクリア
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    脱線は検知されていません
                    {consecutiveDeviations > 0 && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        連続脱線: {consecutiveDeviations}回
                      </div>
                    )}
                  </div>
                )}
                
                {/* デバッグ情報（開発時のみ表示） */}
                {process.env.NODE_ENV === "development" && (
                  <div style={{ 
                    fontSize: "10px", 
                    color: "#999", 
                    marginTop: "8px", 
                    padding: "4px", 
                    backgroundColor: "#f5f5f5", 
                    borderRadius: "4px" 
                  }}>
                    文字起こし数: {transcripts.length} | 
                    連続脱線: {consecutiveDeviations} | 
                    アラート数: {alerts.length} |
                    検知中: {isCheckingDeviation ? "Yes" : "No"}
                  </div>
                )}
              </div>
            </div>

            {/* 保留事項セクション */}
            <div className="parking-section-inner" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: 0 }}>
              <div className="section-header" style={{ flexShrink: 0, padding: "16px 16px 12px 16px" }}>
                <span className="material-icons icon-sm">{ICONS.PARKING}</span>
                <span>{PARKING_LOT_LABEL}</span>
                {parkingLot.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                    ({parkingLot.length}件)
                  </span>
                )}
              </div>
              <div className="section-content" style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 16px 16px 16px" }}>
                {parkingLot.length === 0 ? (
                  <div className="empty-state">{PARKING_LOT_LABEL}は空です</div>
                ) : (
                  <ul className="parking-list">
                    {parkingLot.map((item, index) => (
                      <li key={index} className="parking-item">
                        <div className="parking-item-content">
                          <div className="parking-item-title">{item}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* フッターアクション */}
        <div className="footer-actions" style={{ position: "sticky", bottom: 0, zIndex: 10, backgroundColor: "#ffffff", flexShrink: 0, paddingLeft: "15%", paddingRight: "15%", marginTop: "24px", paddingTop: "16px", paddingBottom: "16px", boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)" }}>
          <button className="btn" onClick={handleBackToListClick}>
            一覧に戻る
          </button>
          <button className="btn btn-danger btn-large" onClick={handleEndMeetingClick}>
            会議終了
          </button>
        </div>
        </div>
      </div>

      {/* 一覧に戻る確認モーダル */}
      {backModalOpen && (
        <div className="modal-overlay" onClick={handleBackModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">会議を中断</div>
            <div className="modal-body">
              会議を中断して一覧画面に戻りますか?
              <br />
              会議の内容は保存されません。
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleBackModalClose}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={handleBackConfirm}>
                中断して戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会議終了確認モーダル */}
      {endModalOpen && (
        <div className="modal-overlay" onClick={handleEndModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">会議を終了</div>
            <div className="modal-body">
              会議を終了してレポート画面へ移動しますか?
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleEndModalClose}>
                キャンセル
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleEndMeetingConfirm}
                disabled={isEndingMeeting}
              >
                {isEndingMeeting ? "終了中..." : "終了してレポートへ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会議終了処理中ローディング（レポート生成中） */}
      {isEndingMeeting && (
        <div className="modal-overlay" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "32px 48px",
            textAlign: "center",
            maxWidth: "420px",
            margin: "0 auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <div className="spinner" style={{
                width: "48px",
                height: "48px",
                border: "4px solid #E0E0E0",
                borderTop: "4px solid #4CAF50",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
            </div>
            <div style={{
              fontSize: "18px",
              fontWeight: "500",
              color: "#212121",
              marginBottom: "8px"
            }}>
              レポートを生成しています。
            </div>
            <div style={{
              fontSize: "14px",
              color: "#757575"
            }}>
              少々お待ちください。
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
