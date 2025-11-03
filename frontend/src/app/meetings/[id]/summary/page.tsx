"use client";

/**
 * ========================================
 * ページ: 会議サマリー（レポート）
 * ========================================
 *
 * URL: /meetings/[id]/summary
 *
 * このページについて:
 * - 完了した会議の結果を確認する画面
 * - AI生成されたサマリー、決定事項、未決事項などを表示
 *
 * 主な機能:
 * - 会議の基本情報表示（タイトル、日時、参加者）
 * - AI生成サマリー表示
 * - 決定事項一覧表示
 * - 未決事項一覧表示
 * - アクション項目一覧表示（担当者、期限付き）
 * - 保留事項（Parking Lot）一覧表示
 * - Excelファイルダウンロード
 * - 音声ファイルダウンロード
 * - 一覧に戻るボタン
 *
 * ダウンロード機能:
 * - Excel形式：会議サマリー全体をスプレッドシートで出力
 * - 音声ファイル：会議の録音データをダウンロード
 *
 * 関連ファイル:
 * - features/meeting-summary/components/* - 会議サマリー関連コンポーネント
 * - lib/types.ts - 型定義
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, SUMMARY_PAGE_TITLE, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { apiClient } from "@/lib/api";
import { formatElapsedHMSFromIso } from "@/lib/time";

export default function MeetingSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // -----------------------------
  // ステート
  // -----------------------------
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState<boolean>(true);

  // トースト通知
  const { toasts, showToast, showSuccess, showError, removeToastByMessage, markAsClosing, removeToastDelayed } = useToast();

  // 会議データ
  const [summaryData, setSummaryData] = useState({
    title: "",
    date: "",
    participants: "",
    duration: "",
    startTime: "",
    overallSummary: "",
    keyPoints: [] as string[],
    decisions: [] as string[],
    unresolved: [] as string[],
    actions: [] as Array<{ task: string; assignee: string; dueDate: string }>,
    parkingLot: [] as string[],
    transcripts: [] as Array<{ text: string; timestamp: string }>,
  });
  const [isPollingSummary, setIsPollingSummary] = useState<boolean>(false);
  const [isSummaryUnavailable, setIsSummaryUnavailable] = useState<boolean>(false);

  // 初期化：APIから会議データを取得（sessionStorageに依存しない）
  useEffect(() => {
    if (!meetingId) return;

    // 取り違え防止のため、遷移直後に初期化
    setSummaryData({
      title: "",
      date: "",
      participants: "",
      duration: "",
      startTime: "",
      overallSummary: "",
      keyPoints: [],
      decisions: [],
      unresolved: [],
      actions: [],
      parkingLot: [],
      transcripts: [],
    });

    let isActive = true;
    const currentId = meetingId;

    const fetchSummaryData = async () => {
      try {
        // 会議メタ
        const meeting = await apiClient.getMeeting(currentId);
        if (!isActive) return;

        const title = meeting.title || "";
        const date = meeting.meetingDate || (meeting.created_at ? String(meeting.created_at).split("T")[0] : "");
        const participants = Array.isArray(meeting.participants) ? meeting.participants.join("、") : "";

        // 要約
        setIsLoadingSummary(true);
        const summary = await apiClient.getSummary(currentId);
        if (!isActive) return;
        setIsLoadingSummary(false);

        // 文字起こし
        setIsLoadingTranscripts(true);
        const transcripts = await apiClient.getTranscripts(currentId);
        if (!isActive) return;
        setIsLoadingTranscripts(false);

        // Parking
        const parkingItems = await apiClient.getParkingItems(currentId);
        if (!isActive) return;

        // 実施時間
        let durationText = "";
        let startTimeText = "";
        if (meeting.started_at && meeting.ended_at) {
          const start = new Date(meeting.started_at);
          const end = new Date(meeting.ended_at);
          const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
          durationText = `${minutes}分`;
          startTimeText = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        }

        setSummaryData({
          title,
          date,
          participants,
          duration: durationText,
          startTime: startTimeText,
          overallSummary: summary?.summary || "",
          keyPoints: [],
          decisions: summary?.decisions || [],
          unresolved: summary?.undecided || [],
          actions: (summary?.actions || []).map((action: any) => ({
            task: action.title || "",
            assignee: action.owner || "",
            dueDate: action.due || "",
          })),
          parkingLot: (parkingItems || []).map((p: any) => p.title).filter((t: string) => !!t),
          transcripts: transcripts.map((t: any) => {
            // バックエンドで保存された経過時間を使用（なければフォールバック）
            let elapsedTime = t.elapsed_time;
            if (!elapsedTime) {
              // フォールバック: 既存データで経過時間がない場合は計算
              const meetingStartIso = meeting.started_at ? meeting.started_at : undefined;
              elapsedTime = formatElapsedHMSFromIso(meetingStartIso, t.timestamp);
            }
            return { text: t.text, timestamp: elapsedTime };
          }),
        });

        // 初期ロード時に要約が取得できた場合はリセット
        if (summary?.summary) {
          setIsSummaryUnavailable(false);
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to fetch summary data:", error);
        setIsLoadingSummary(false);
        setIsLoadingTranscripts(false);
      }
    };

    fetchSummaryData();
    return () => { isActive = false; };
  }, [meetingId]);

  // 要約が空の場合、バックグラウンド生成をポーリング
  useEffect(() => {
    // 要約が既に存在する、またはローディング中の場合はポーリング不要
    if (isLoadingSummary) return;
    if (summaryData.overallSummary) return;

    let pollCount = 0;
    const maxPolls = 30; // 最大30回（2.5分間）

    const pollSummary = async () => {
      try {
        pollCount++;
        console.log(`要約をポーリング中... (${pollCount}/${maxPolls})`);

        const summary = await apiClient.getSummary(meetingId);

        // 有効な要約が取得できた場合
        if (summary?.summary && summary.summary !== "") {
          console.log("要約が生成されました");
          setSummaryData(prev => ({
            ...prev,
            overallSummary: summary.summary,
            decisions: summary.decisions || [],
            unresolved: summary.undecided || [],
            actions: (summary.actions || []).map((action: any) => ({
              task: action.title || "",
              assignee: action.owner || "",
              dueDate: action.due || "",
            })),
          }));

          // 要約が取得できたのでリセット
          setIsSummaryUnavailable(false);

          // ポーリング停止
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else if (pollCount >= maxPolls) {
          console.log("要約生成のポーリングを終了します（最大試行回数に達しました）");
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          setIsSummaryUnavailable(true);
        }
      } catch (error) {
        console.error("要約のポーリングに失敗しました:", error);
      }
    };

    // 5秒ごとにポーリング
    setIsPollingSummary(true);
    const pollInterval = setInterval(pollSummary, 5000);

    // 初回は即座に実行
    pollSummary();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsPollingSummary(false);
    };
  }, [meetingId, isLoadingSummary, summaryData.overallSummary]);

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleDownloadExcel = () => {
    console.log("Excelダウンロード:", meetingId);
    showSuccess(`${DOWNLOAD_FORMAT_LABELS.excel}をダウンロードします`);
  };

  const handleDownloadAudio = async () => {
    // 処理中のトーストは自動で閉じないようにする（duration: Infinity）
    showToast(`${DOWNLOAD_FORMAT_LABELS.audio}をダウンロード中...`, "info", Infinity, true);
    
    try {
      await apiClient.downloadAudio(meetingId);
      
      // ダウンロード中のトーストをメッセージで検索して閉じる
      removeToastByMessage(`${DOWNLOAD_FORMAT_LABELS.audio}をダウンロード中...`, "info");
      
      // 完了メッセージを表示
      showSuccess(`${DOWNLOAD_FORMAT_LABELS.audio}のダウンロードが完了しました`);
    } catch (error) {
      console.error("音声ファイルのダウンロードに失敗しました:", error);
      
      // ダウンロード中のトーストをメッセージで検索して閉じる
      removeToastByMessage(`${DOWNLOAD_FORMAT_LABELS.audio}をダウンロード中...`, "info");
      
      // エラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました";
      showError(`ダウンロードに失敗しました: ${errorMessage}`);
    }
  };

  const handleBackToList = () => {
    router.push("/");
  };

  // -----------------------------
  // レンダリング
  // -----------------------------

  return (
    <div className="page">
      <style suppressHydrationWarning>{commonStyles}</style>

      <div className="page-container">
        {/* ヘッダー */}
        <div className="meeting-header">
          <div className="meeting-title">{SUMMARY_PAGE_TITLE}</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content">
          {/* 詳細セクション */}
          <div className="details-section">
          <div className="details-title">{summaryData.title}</div>
          <div className="details-meta">
            <div className="details-meta-item">
              <span className="material-icons icon-sm">{ICONS.CALENDAR}</span>
              <span>{summaryData.date}</span>
            </div>
            {summaryData.startTime && (
              <div className="details-meta-item">
                <span className="material-icons icon-sm">{ICONS.CLOCK}</span>
                <span>開始時刻: {summaryData.startTime}</span>
              </div>
            )}
            <div className="details-meta-item">
              <span className="material-icons icon-sm">{ICONS.CLOCK}</span>
              <span>所要時間: {summaryData.duration}</span>
            </div>
            <div className="details-meta-item">
              <span className="material-icons icon-sm">{ICONS.GROUP}</span>
              <span>参加者: {summaryData.participants}</span>
            </div>
            <button className="btn" onClick={handleDownloadExcel} style={{ marginLeft: "auto" }}>
              <span className="material-icons icon-sm" aria-hidden="true">{ICONS.DOWNLOAD}</span>
              <span>{DOWNLOAD_FORMAT_LABELS.excel}</span>
            </button>
            <button className="btn" onClick={handleDownloadAudio}>
              <span className="material-icons icon-sm" aria-hidden="true">{ICONS.DOWNLOAD}</span>
              <span>{DOWNLOAD_FORMAT_LABELS.audio}</span>
            </button>
          </div>
        </div>

        {/* 3カラムレイアウト */}
        <div className="three-column-layout">
          {/* 左カラム: 文字起こし */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.TRANSCRIBE}</span>
              <span>文字起こし</span>
            </div>
            <div className="column-content">
              {isLoadingTranscripts ? (
                <div className="loading-box">
                  <div className="spinner"></div>
                  <span>読み込み中...</span>
                </div>
              ) : summaryData.transcripts.length > 0 ? (
                summaryData.transcripts.map((transcript, index) => (
                  <div key={index} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e6e8ee" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                      {transcript.timestamp}
                    </div>
                    <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>{transcript.text}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", padding: "20px" }}>
                  文字起こし内容がありません
                </div>
              )}
            </div>
          </div>

          {/* 中央カラム: 要約 */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
              <span>要約</span>
            </div>
            <div className="column-content">
              {!summaryData.overallSummary ? (
                <div className="loading-box">
                  {isLoadingSummary || isPollingSummary ? (
                    <>
                      <div className="spinner"></div>
                      <span>要約生成中...</span>
                    </>
                  ) : isSummaryUnavailable ? (
                    <span>要約データがありません</span>
                  ) : (
                    <span>会議開始から約3分後に要約が自動生成されます</span>
                  )}
                </div>
              ) : (
                <div style={{ lineHeight: 1.6, fontSize: "14px", color: "#374151" }}>
                  <ReactMarkdown
                    components={{
                      h2: ({ node, ...props }) => (
                        <>
                          <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '20px 0 16px 0' }} />
                          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }} {...props} />
                        </>
                      ),
                      h3: ({ node, ...props }) => (
                        <>
                          <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '16px 0 12px 0' }} />
                          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#374151' }} {...props} />
                        </>
                      ),
                      p: ({ node, ...props }) => (
                        <p style={{ marginBottom: '12px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }} {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul style={{ marginLeft: '20px', marginBottom: '12px', fontSize: '14px', color: '#374151' }} {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li style={{ marginBottom: '6px', lineHeight: '1.6' }} {...props} />
                      ),
                    }}
                  >
                    {summaryData.overallSummary}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム: 決定事項・未決事項・アクションアイテム・保留事項 */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.CHECK}</span>
              <span>決定事項・未決事項・アクション・保留事項</span>
            </div>
            <div className="column-content">
              {!summaryData.overallSummary ? (
                <div className="loading-box">
                  {isLoadingSummary || isPollingSummary ? (
                    <>
                      <div className="spinner"></div>
                      <span>要約生成中...</span>
                    </>
                  ) : isSummaryUnavailable ? (
                    <span>要約データがありません</span>
                  ) : (
                    <span>会議開始から約3分後に要約が自動生成されます</span>
                  )}
                </div>
              ) : (
                <>
                  {/* 決定事項 */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "12px", color: "#1f2937", fontSize: "14px" }}>
                      決定事項
                    </div>
                    {summaryData.decisions.length > 0 ? (
                      summaryData.decisions.map((decision, index) => (
                        <div key={index} className="decision-item" style={{ marginBottom: "8px", paddingLeft: "12px", borderLeft: "3px solid #10b981" }}>
                          <div className="item-title" style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>{decision}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>決定事項はありません</div>
                    )}
                  </div>

                  {/* 未決事項 */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "12px", color: "#1f2937", fontSize: "14px" }}>
                      未決事項
                    </div>
                    {summaryData.unresolved.length > 0 ? (
                      summaryData.unresolved.map((item, index) => (
                        <div key={index} className="unresolved-item" style={{ marginBottom: "8px", paddingLeft: "12px", borderLeft: "3px solid #f59e0b" }}>
                          <div className="item-title" style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>{item}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>未決事項はありません</div>
                    )}
                  </div>

                  {/* アクションアイテム */}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "12px", color: "#1f2937", fontSize: "14px" }}>
                      アクションアイテム
                    </div>
                    {summaryData.actions.length > 0 ? (
                      summaryData.actions.map((action, index) => (
                        <div key={index} className="action-item" style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: "3px solid #3b82f6" }}>
                          <div className="item-title" style={{ marginBottom: "4px", fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>{action.task}</div>
                          <div className="item-meta" style={{ fontSize: "12px", color: "#6b7280" }}>
                            担当: {action.assignee || "未定"} / 期限: {action.dueDate || "未定"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>アクションアイテムはありません</div>
                    )}
                  </div>

                  {/* 保留事項（Parking Lot） */}
                  <div style={{ marginTop: "24px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "12px", color: "#1f2937", fontSize: "14px" }}>
                      保留事項
                    </div>
                    {summaryData.parkingLot.length > 0 ? (
                      summaryData.parkingLot.map((item, index) => (
                        <div key={index} className="parking-item" style={{ marginBottom: "8px", paddingLeft: "12px", borderLeft: "3px solid #f97316" }}>
                          <div className="item-title" style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>{item}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>保留事項はありません</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          {/* フッターアクション */}
          <div className="footer-actions">
            <button className="btn btn-large" onClick={handleBackToList}>
              一覧に戻る
            </button>
          </div>
        </div>
      </div>

      {/* トースト通知 */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          isClosing={toast.isClosing}
          onMarkAsClosing={() => markAsClosing(toast.id)}
          onRemoveDelayed={(delay) => removeToastDelayed(toast.id, delay)}
          index={index}
        />
      ))}
    </div>
  );
}
