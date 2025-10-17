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
 * - shared/lib/types.ts - 型定義
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, PARKING_LOT_LABEL, SUMMARY_PAGE_TITLE, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";

export default function MeetingSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // -----------------------------
  // ステート
  // -----------------------------
  const [isLoading] = useState<boolean>(false);

  // トースト通知
  const { toasts, showSuccess, removeToast } = useToast();

  // 会議データ（sessionStorageから取得）
  const [summaryData, setSummaryData] = useState({
    title: "",
    date: "",
    participants: "",
    duration: "",
    startTime: "",
    // バックエンド未実装のため、以下はダミーデータ
    overallSummary: "要件すり合わせ会議では、認証方式の比較検討を中心に議論が行われ、バックエンドAPIの採用方針が決定されました。",
    keyPoints: [
      "認証方式の比較観点（性能/運用/障害時復旧）",
      "JWTとMTLSの運用負荷の違い",
      "セキュリティ要件の再確認が必要",
    ],
    decisions: [
      {
        description: "バックエンドはAPI A採用。理由：互換性と運用負荷。",
        approver: "田中",
        decidedAt: "12:05",
      },
    ],
    unresolved: [
      {
        topic: "認可方式（JWT vs MTLS）",
        missingInfo: "基盤運用方針・障害事例",
        nextAction: "PoC比較＋セキュリティレビュー依頼",
      },
    ],
    actions: [
      {
        task: "JWT PoC実施",
        assignee: "佐藤",
        dueDate: "10/18",
      },
      {
        task: "SLA要件確認",
        assignee: "鈴木",
        dueDate: "10/15",
      },
    ],
    parkingLot: ["ABテスト基盤の統合案"],
  });

  // 初期化：sessionStorageから会議データを取得
  useEffect(() => {
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
  }, []);

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
  if (isLoading) {
    return (
      <div className="page">
        <style suppressHydrationWarning>{commonStyles}</style>
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <div style={{ marginTop: "16px" }}>レポートを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <style>{commonStyles}</style>
      <style>{`
        .card-body {
          padding: 24px 0;
        }
        .section-content {
          font-size: 14px;
          line-height: 1.8;
          color: #374151;
        }
        .footer-actions {
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid #e6e8ee;
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

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
          </div>
          <div className="details-actions">
            <button className="btn" onClick={handleDownloadExcel}>
              <span className="material-icons icon-sm" aria-hidden="true">{ICONS.DOWNLOAD}</span>
              <span>{DOWNLOAD_FORMAT_LABELS.excel}</span>
            </button>
            <button className="btn" onClick={handleDownloadAudio}>
              <span className="material-icons icon-sm" aria-hidden="true">{ICONS.DOWNLOAD}</span>
              <span>{DOWNLOAD_FORMAT_LABELS.audio}</span>
            </button>
          </div>
        </div>

        <div className="card-body">
            {/* 要約本文 */}
            <div className="section">
              <div className="section-title">
                <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
                <span>要約</span>
              </div>
              <div className="section-content">
                <p style={{ marginBottom: "16px" }}>{summaryData.overallSummary}</p>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>重要論点：</div>
                <ul className="key-points">
                  {summaryData.keyPoints.map((point, index) => (
                    <li key={index} className="key-point-item">
                      ・{point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 決定事項 */}
            <div className="section">
              <div className="section-title">
                <span className="material-icons icon-sm">{ICONS.CHECK}</span>
                <span>決定事項</span>
              </div>
              {summaryData.decisions.map((decision, index) => (
                <div key={index} className="decision-item">
                  <div className="item-title">{decision.description}</div>
                  <div className="item-meta">
                    承認: {decision.approver} / 決定時刻: {decision.decidedAt}
                  </div>
                </div>
              ))}
            </div>

            {/* 未決事項 */}
            <div className="section">
              <div className="section-title">
                <span className="material-icons icon-sm">{ICONS.ALERT}</span>
                <span>未決事項（提案付き）</span>
              </div>
              {summaryData.unresolved.map((item, index) => (
                <div key={index} className="unresolved-item">
                  <div className="item-title">{item.topic}</div>
                  <div className="section-content">
                    <div>不足情報: {item.missingInfo}</div>
                    <div style={{ color: "#667eea", fontWeight: 600, marginTop: "4px" }}>
                      次の一手: {item.nextAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* アクションアイテム */}
            <div className="section">
              <div className="section-title">
                <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
                <span>アクションアイテム</span>
              </div>
              {summaryData.actions.map((action, index) => (
                <div key={index} className="action-item">
                  <div className="item-title">{action.task}</div>
                  <div className="item-meta">
                    担当: {action.assignee} / 期限: {action.dueDate}
                  </div>
                </div>
              ))}
            </div>

            {/* 保留事項 */}
            <div className="section">
              <div className="section-title">
                <span className="material-icons icon-sm">{ICONS.PARKING}</span>
                <span>{PARKING_LOT_LABEL}</span>
              </div>
              {summaryData.parkingLot.map((item, index) => (
                <div key={index} className="parking-item">
                  {item}
                </div>
              ))}
            </div>

          {/* フッターアクション */}
          <div className="footer-actions">
            <button className="btn btn-large" onClick={handleBackToList}>
              一覧に戻る
            </button>
          </div>
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
