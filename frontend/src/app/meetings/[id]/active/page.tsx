"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, PARKING_LOT_LABEL } from "@/lib/constants";

/**
 * 会議中画面
 *
 * 機能:
 * - アジェンダ進捗バー
 * - リアルタイム文字起こし表示
 * - 要約表示
 * - アラート表示（脱線検知）
 * - アラート対応: 無視 / 保留事項に退避
 * - 保留事項表示
 * - 会議終了 → 会議レポート画面へ遷移
 */
export default function MeetingActivePage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // -----------------------------
  // ステート
  // -----------------------------
  const [transcripts] = useState<Array<{
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
  }>>([
    {
      id: "1",
      speaker: "田中",
      text: "今日の議題について話しましょう。まず、前回の振り返りから始めます。",
      timestamp: "10:00:15",
    },
    {
      id: "2",
      speaker: "佐藤",
      text: "前回のアクションアイテムについて報告します。API設計は完了しました。",
      timestamp: "10:01:32",
    },
    {
      id: "3",
      speaker: "鈴木",
      text: "認証方式について議論したいのですが、JWTとMTLSのどちらが良いでしょうか。",
      timestamp: "10:03:45",
    },
  ]);

  const [summary] = useState<string>(
    "認証方式の比較検討を中心に議論が行われています。JWTとMTLSの比較観点として、性能、運用負荷、障害時の復旧性が挙げられています。"
  );

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: "deviation";
    message: string;
    timestamp: string;
  }>>([
    {
      id: "alert1",
      type: "deviation",
      message: "議題「前回の振り返り」から逸脱している可能性があります",
      timestamp: "10:03:50",
    },
  ]);

  const [parkingLot, setParkingLot] = useState<string[]>([]);
  const [backModalOpen, setBackModalOpen] = useState<boolean>(false);
  const [endModalOpen, setEndModalOpen] = useState<boolean>(false);

  // アジェンダ進捗データ
  const agendaItems = [
    { title: "認証方式の確認", duration: 10, completed: 5 },
    { title: "API方針の確認", duration: 10, completed: 0 },
    { title: "次アクション決定", duration: 5, completed: 0 },
  ];

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleIgnoreAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
  };

  const handleMoveToParkingLot = (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setParkingLot([...parkingLot, alert.message]);
      setAlerts(alerts.filter((a) => a.id !== alertId));
    }
  };

  const handleEndMeetingClick = () => {
    setEndModalOpen(true);
  };

  const handleEndMeetingConfirm = () => {
    console.log("会議終了:", meetingId);
    setEndModalOpen(false);
    router.push(`/meetings/${meetingId}/summary`);
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

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="page">
      <style>{commonStyles}</style>
      <style>{`
        /* 追加のローカルスタイル */
        .meeting-info-section {
          padding: 16px 0;
          border-bottom: 1px solid #e6e8ee;
          background: #fafbfc;
        }
        .meeting-info {
          display: flex;
          gap: 24px;
          font-size: 14px;
          flex-wrap: wrap;
        }
        .meeting-info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #374151;
        }

        /* アジェンダ進捗バー */
        .agenda-progress-section {
          padding: 20px 0;
          background: #fff;
          border-bottom: 1px solid #e6e8ee;
        }
        .agenda-progress-title {
          font-size: 14px;
          font-weight: 600;
          color: #424242;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .agenda-progress-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .agenda-progress-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .agenda-progress-label {
          font-size: 13px;
          color: #616161;
          min-width: 140px;
        }
        .agenda-progress-bar {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .agenda-progress-fill {
          height: 100%;
          background: #2196F3;
          transition: width 0.3s ease;
        }
        .agenda-progress-time {
          font-size: 12px;
          color: #757575;
          min-width: 60px;
          text-align: right;
        }

        /* 3カラムレイアウト */
        .three-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          padding: 24px 0;
        }

        /* 各カラムセクション */
        .column-section {
          background: #fff;
          border: 1px solid #e6e8ee;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          height: 500px;
        }

        /* アラート・保留事項の統合カラム */
        .alert-parking-column {
          padding: 0;
        }
        .alert-section-inner,
        .parking-section-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 16px;
          border-bottom: 1px solid #e6e8ee;
        }
        .parking-section-inner {
          border-bottom: none;
        }
        .section-header {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #212121;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .section-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }
        .section-content::-webkit-scrollbar {
          width: 6px;
        }
        .section-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .section-content::-webkit-scrollbar-thumb {
          background: #bdbdbd;
          border-radius: 3px;
        }
        .section-content::-webkit-scrollbar-thumb:hover {
          background: #9e9e9e;
        }

        /* 文字起こし */
        .transcript-item {
          margin-bottom: 12px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #2196F3;
        }
        .transcript-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .speaker {
          font-weight: 600;
          font-size: 13px;
          color: #212121;
        }
        .timestamp {
          font-size: 11px;
          color: #757575;
        }
        .transcript-text {
          font-size: 13px;
          line-height: 1.5;
          color: #424242;
        }

        /* 要約 */
        .summary-text {
          font-size: 13px;
          line-height: 1.7;
          color: #424242;
        }

        /* アラート */
        .alert-item {
          background: #fff4e5;
          border: 1px solid #ffe69c;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 10px;
        }
        .alert-timestamp {
          font-size: 11px;
          color: #9a6700;
          margin-bottom: 4px;
        }
        .alert-message {
          font-size: 12px;
          color: #9a6700;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .alert-actions {
          display: flex;
          gap: 6px;
        }
        .alert-btn {
          flex: 1;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
          text-align: center;
        }
        .alert-btn-ignore {
          background: #fff;
          color: #616161;
          border-color: #d9dbe3;
        }
        .alert-btn-ignore:hover {
          background: #f5f5f5;
        }
        .alert-btn-parking {
          background: #2196F3;
          color: #fff;
          border-color: #2196F3;
        }
        .alert-btn-parking:hover {
          background: #1976D2;
        }

        /* 保留事項リスト */
        .parking-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .parking-item {
          padding: 10px 12px;
          background: #fff3e0;
          border-radius: 6px;
          font-size: 13px;
          color: #e65100;
          border-left: 3px solid #ff9800;
        }
        .empty-state {
          text-align: center;
          color: #9e9e9e;
          font-size: 13px;
          padding: 40px 20px;
        }

        /* フッターアクション */
        .footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 0;
          border-top: 1px solid #e6e8ee;
          background: #fafbfc;
        }

        @media (max-width: 1024px) {
          .three-column-layout {
            grid-template-columns: 1fr;
          }
          .column-section {
            height: 300px;
          }
        }
      `}</style>

      <div className="page-container">
        {/* ヘッダー */}
        <div className="meeting-header">
          <div className="meeting-title">会議中画面</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content">
          {/* 会議情報セクション */}
          <div className="meeting-info-section">
          <div className="meeting-info">
            <div className="meeting-info-item">
              <strong>会議名:</strong>
              <span>要件すり合わせ会議</span>
            </div>
            <div className="meeting-info-item">
              <strong>開始時刻:</strong>
              <span>10:00</span>
            </div>
            <div className="meeting-info-item">
              <strong>経過時間:</strong>
              <span>15分30秒</span>
            </div>
            <div className="meeting-info-item">
              <strong>参加者:</strong>
              <span>田中、佐藤、鈴木、山田</span>
            </div>
          </div>
        </div>

        {/* アジェンダ進捗バー */}
        <div className="agenda-progress-section">
          <div className="agenda-progress-title">
            <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
            <span>アジェンダ進捗バー</span>
          </div>
          <div className="agenda-progress-list">
            {agendaItems.map((item, index) => (
              <div key={index} className="agenda-progress-item">
                <div className="agenda-progress-label">{item.title}</div>
                <div className="agenda-progress-bar">
                  <div
                    className="agenda-progress-fill"
                    style={{ width: `${(item.completed / item.duration) * 100}%` }}
                  ></div>
                </div>
                <div className="agenda-progress-time">
                  {item.completed}/{item.duration}m
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3カラムレイアウト */}
        <div className="three-column-layout">
          {/* 文字起こし */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.TRANSCRIBE}</span>
              <span>文字起こし</span>
            </div>
            <div className="section-content">
              {transcripts.map((item) => (
                <div key={item.id} className="transcript-item">
                  <div className="transcript-header">
                    <span className="speaker">{item.speaker}</span>
                    <span className="timestamp">{item.timestamp}</span>
                  </div>
                  <div className="transcript-text">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 要約 */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.ASSIGNMENT}</span>
              <span>要約</span>
            </div>
            <div className="section-content">
              <div className="summary-text">{summary}</div>
            </div>
          </div>

          {/* アラート・保留事項の統合カラム */}
          <div className="column-section alert-parking-column">
            {/* アラートセクション */}
            <div className="alert-section-inner">
              <div className="section-header">
                <span className="material-icons icon-sm">{ICONS.ALERT}</span>
                <span>アラート</span>
              </div>
              <div className="section-content">
                {alerts.length === 0 ? (
                  <div className="empty-state">アラートはありません</div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="alert-item">
                      <div className="alert-timestamp">{alert.timestamp}</div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-actions">
                        <button
                          className="alert-btn alert-btn-ignore"
                          onClick={() => handleIgnoreAlert(alert.id)}
                        >
                          無視
                        </button>
                        <button
                          className="alert-btn alert-btn-parking"
                          onClick={() => handleMoveToParkingLot(alert.id)}
                        >
                          保留事項へ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 保留事項セクション */}
            <div className="parking-section-inner">
              <div className="section-header">
                <span className="material-icons icon-sm">{ICONS.PARKING}</span>
                <span>{PARKING_LOT_LABEL}</span>
              </div>
              <div className="section-content">
                {parkingLot.length === 0 ? (
                  <div className="empty-state">{PARKING_LOT_LABEL}は空です</div>
                ) : (
                  <ul className="parking-list">
                    {parkingLot.map((item, index) => (
                      <li key={index} className="parking-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* フッターアクション */}
        <div className="footer-actions">
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
              <button className="btn btn-success" onClick={handleEndMeetingConfirm}>
                終了してレポートへ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
