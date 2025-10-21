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
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, SUMMARY_PAGE_TITLE, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { apiClient } from "@/lib/api";

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
  const { toasts, showSuccess, removeToast } = useToast();

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

  // 初期化：sessionStorageとAPIから会議データを取得
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // sessionStorageから基本情報を取得
        const storedData = sessionStorage.getItem("meetingSummary");
        let basicInfo = {
          title: "",
          date: "",
          participants: "",
          duration: "",
          startTime: "",
        };

        if (storedData) {
          const data = JSON.parse(storedData);
          basicInfo = {
            title: data.title || "",
            date: data.date || "",
            participants: data.participants || "",
            duration: data.duration || "",
            startTime: data.startTime || "",
          };
        }

        // APIから要約データを取得
        setIsLoadingSummary(true);
        const summary = await apiClient.getSummary(meetingId);
        setIsLoadingSummary(false);

        // APIから文字起こしデータを取得
        setIsLoadingTranscripts(true);
        const transcripts = await apiClient.getTranscripts(meetingId);
        setIsLoadingTranscripts(false);

        setSummaryData({
          ...basicInfo,
          overallSummary: summary?.summary || "要約データがありません",
          keyPoints: [],
          decisions: summary?.decisions || [],
          unresolved: summary?.undecided || [],
          actions: (summary?.actions || []).map((action: any) => ({
            task: action.title || "",
            assignee: action.owner || "",
            dueDate: action.due || "",
          })),
          parkingLot: [],
          transcripts: transcripts.map((t: any) => ({
            text: t.text,
            timestamp: t.timestamp,
          })),
        });
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
        setIsLoadingSummary(false);
        setIsLoadingTranscripts(false);
        // エラー時はsessionStorageのデータのみ使用
        const storedData = sessionStorage.getItem("meetingSummary");
        if (storedData) {
          const data = JSON.parse(storedData);
          setSummaryData((prev) => ({
            ...prev,
            title: data.title || "",
            date: data.date || "",
            participants: data.participants || "",
            duration: data.duration || "",
            startTime: data.startTime || "",
          }));
        }
      }
    };

    fetchSummaryData();
  }, [meetingId]);

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleDownloadExcel = () => {
    console.log("Excelダウンロード:", meetingId);
    showSuccess(`${DOWNLOAD_FORMAT_LABELS.excel}をダウンロードします`);
  };

  const handleDownloadAudio = () => {
    console.log("音声ダウンロード:", meetingId);
    showSuccess(`${DOWNLOAD_FORMAT_LABELS.audio}をダウンロードします`);
  };

  const handleBackToList = () => {
    router.push("/");
  };

  // -----------------------------
  // レンダリング
  // -----------------------------

  return (
    <div className="page">
      <style>{commonStyles}</style>

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
                    <div>{transcript.text}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
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
              {isLoadingSummary ? (
                <div className="loading-box">
                  <div className="spinner"></div>
                  <span>読み込み中...</span>
                </div>
              ) : (
                <p style={{ lineHeight: 1.8 }}>{summaryData.overallSummary}</p>
              )}
            </div>
          </div>

          {/* 右カラム: 決定事項・未決事項・アクションアイテム */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.CHECK}</span>
              <span>決定事項・未決事項・アクション</span>
            </div>
            <div className="column-content">
              {isLoadingSummary ? (
                <div className="loading-box">
                  <div className="spinner"></div>
                  <span>読み込み中...</span>
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
                          <div className="item-title">{decision}</div>
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
                          <div className="item-title">{item}</div>
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
                          <div className="item-title" style={{ marginBottom: "4px" }}>{action.task}</div>
                          <div className="item-meta" style={{ fontSize: "12px", color: "#6b7280" }}>
                            担当: {action.assignee || "未定"} / 期限: {action.dueDate || "未定"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>アクションアイテムはありません</div>
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
