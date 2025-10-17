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
 * - shared/lib/types.ts - 型定義
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, PARKING_LOT_LABEL } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import LiveTranscriptArea from "@/components/sections/LiveTranscriptArea/LiveTranscriptArea";

export default function MeetingActivePage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // 会議データを取得（本来はAPIから取得、現在はsessionStorageから取得）
  const [meetingData, setMeetingData] = useState<{
    title: string;
    meetingDate?: string;
    participants: string[];
    agendaItems: Array<{
      title: string;
      duration: number;
      expectedOutcome: string;
    }>;
  } | null>(null);

  // 会議開始時刻と経過時間
  const [startTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

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

  const [summary] = useState<string>("");

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: "deviation";
    message: string;
    timestamp: string;
  }>>([]);

  const [parkingLot, setParkingLot] = useState<string[]>([]);
  const [backModalOpen, setBackModalOpen] = useState<boolean>(false);
  const [endModalOpen, setEndModalOpen] = useState<boolean>(false);

  // トースト通知
  const { toasts, showSuccess, removeToast } = useToast();

  // 初期化：sessionStorageから会議データを取得
  useEffect(() => {
    const storedData = sessionStorage.getItem("currentMeeting");
    if (storedData) {
      const data = JSON.parse(storedData);
      setMeetingData(data);
    } else {
      // データがない場合はデフォルトデータを設定
      setMeetingData({
        title: "会議",
        participants: [],
        agendaItems: [],
      });
    }
  }, []);

  // 経過時間の更新（1秒ごと）
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

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
  const formatStartTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 各アジェンダの経過時間を計算
  const calculateAgendaProgress = () => {
    if (!meetingData?.agendaItems || meetingData.agendaItems.length === 0) {
      return [];
    }

    const elapsedMinutes = elapsedSeconds / 60;
    let remainingMinutes = elapsedMinutes;

    return meetingData.agendaItems.map((item) => {
      const completed = Math.min(remainingMinutes, item.duration);
      remainingMinutes = Math.max(0, remainingMinutes - item.duration);

      return {
        title: item.title,
        duration: item.duration,
        completed: completed, // 小数を保持してスムーズなアニメーションに
        completedMinutes: Math.floor(completed), // 表示用は整数
      };
    });
  };

  const agendaProgress = calculateAgendaProgress();

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleIgnoreAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
    showSuccess("アラートを無視しました");
  };

  const handleMoveToParkingLot = (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setParkingLot([...parkingLot, alert.message]);
      setAlerts(alerts.filter((a) => a.id !== alertId));
      showSuccess("保留事項に追加しました");
    }
  };

  const handleEndMeetingClick = () => {
    setEndModalOpen(true);
  };

  const handleEndMeetingConfirm = async () => {
    // 会議終了時に会議レポート用のデータを保存
    if (meetingData) {
      // 経過時間を計算（分単位）
      const durationMinutes = Math.floor(elapsedSeconds / 60);

      const meetingSummaryData = {
        title: meetingData.title,
        date: meetingData.meetingDate || new Date().toISOString().split('T')[0],
        participants: meetingData.participants.join("、"),
        duration: `${durationMinutes}分`,
        startTime: formatStartTime(startTime),
      };

      sessionStorage.setItem("meetingSummary", JSON.stringify(meetingSummaryData));

      // JSONファイルを更新（ステータスを「完了」に、開始時刻と所要時間を記録）
      try {
        // 既存の会議データを取得
        const response = await fetch(`/api/meetings/${meetingId}`);
        if (response.ok) {
          const existingMeeting = await response.json();

          // データを更新
          const updatedMeeting = {
            ...existingMeeting,
            status: "完了" as const,
            startTime: formatStartTime(startTime),
            duration: `${durationMinutes}分`,
            updatedAt: new Date().toISOString(),
          };

          // 個別のJSONファイルを更新
          await fetch(`/api/meetings/${meetingId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedMeeting),
          });

          console.log("Meeting status updated to 完了");
        }
      } catch (error) {
        console.error("Failed to update meeting status:", error);
      }
    }

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
          <div className="meeting-title">会議中画面</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content">
          {/* 会議情報セクション */}
          <div className="meeting-info-section">
          <div className="meeting-info">
            <div className="meeting-info-item">
              <strong>会議名:</strong>
              <span>{meetingData?.title || "読み込み中..."}</span>
            </div>
            <div className="meeting-info-item">
              <strong>開始時刻:</strong>
              <span>{formatStartTime(startTime)}</span>
            </div>
            <div className="meeting-info-item">
              <strong>経過時間:</strong>
              <span>{formatElapsedTime(elapsedSeconds)}</span>
            </div>
            <div className="meeting-info-item">
              <strong>参加者:</strong>
              <span>{meetingData?.participants.join("、") || "なし"}</span>
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
        <div className="three-column-layout">
          {/* 文字起こし（LiveTranscriptArea統合） */}
          <div className="column-section">
            <div className="section-header">
              <span className="material-icons icon-sm">{ICONS.TRANSCRIBE}</span>
              <span>ライブ字幕</span>
            </div>
            <div className="section-content">
              <LiveTranscriptArea
                meetingId={meetingId}
                onTranscriptsUpdate={handleTranscriptsUpdate}
              />
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
