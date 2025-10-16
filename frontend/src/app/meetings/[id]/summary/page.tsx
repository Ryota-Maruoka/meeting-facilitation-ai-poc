"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, PARKING_LOT_LABEL, SUMMARY_PAGE_TITLE, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";

/**
 * 会議レポート画面
 *
 * 機能:
 * - 会議の要約・決定事項・未決事項・アクション・保留事項の表示
 * - Excelファイルダウンロード
 * - 音声ファイルダウンロード
 * - 一覧に戻る
 */
export default function MeetingSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // -----------------------------
  // ステート
  // -----------------------------
  const [isLoading] = useState<boolean>(false);

  // ダミーデータ
  const summaryData = {
    title: "要件すり合わせ",
    date: "2025-10-07",
    participants: "田中、佐藤、鈴木、山田",
    duration: "60分",
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
  };

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleDownloadExcel = () => {
    console.log("Excelダウンロード:", meetingId);
    alert(`${DOWNLOAD_FORMAT_LABELS.excel}をダウンロードします`);
  };

  const handleDownloadAudio = () => {
    console.log("音声ダウンロード:", meetingId);
    alert(`${DOWNLOAD_FORMAT_LABELS.audio}をダウンロードします`);
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
        <style>{commonStyles}</style>
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
        /* 追加のローカルスタイル */
        .details-section {
          padding: 24px 0;
          border-bottom: 1px solid #e6e8ee;
          background: #fafbfc;
        }
        .details-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111;
        }
        .details-meta {
          display: flex;
          gap: 24px;
          font-size: 14px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .details-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #374151;
        }
        .details-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .card-body {
          padding: 24px 0;
        }
        .section {
          background: #fff;
          border: 1px solid #e6e8ee;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 16px;
          color: #111;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-content {
          font-size: 14px;
          line-height: 1.8;
          color: #374151;
        }
        .key-points {
          list-style: none;
          padding: 0;
        }
        .key-point-item {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .key-point-item:last-child {
          border-bottom: none;
        }
        .decision-item,
        .unresolved-item,
        .action-item,
        .parking-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 12px;
        }
        .decision-item {
          border-left: 4px solid #146c43;
        }
        .unresolved-item {
          border-left: 4px solid #9a6700;
        }
        .action-item {
          border-left: 4px solid #667eea;
        }
        .parking-item {
          border-left: 4px solid #6b7280;
        }
        .item-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
          color: #111;
        }
        .item-meta {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }
        .footer-actions {
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid #e6e8ee;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .summary-meta {
            flex-direction: column;
            gap: 8px;
          }
          .header-actions {
            flex-direction: column;
          }
          .header-actions .btn {
            width: 100%;
          }
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
    </div>
  );
}
