"use client";

/**
 * ========================================
 * ページ: 新規会議作成
 * ========================================
 *
 * URL: /meetings/new
 *
 * このページについて:
 * - 新しい会議を作成するフォーム画面
 * - 会議の基本情報、参加者、アジェンダを設定
 *
 * 主な機能:
 * - 会議の基本情報入力（タイトル、目的、期待する成果物）
 * - 会議日程選択（カレンダーUI）
 * - 参加者の追加・削除
 * - アジェンダ項目の追加・削除・並び替え
 * - 下書き保存 → 一覧画面へ遷移
 * - 会議作成 → 会議進行中画面へ遷移
 * - キャンセル → 一覧画面へ戻る
 *
 * バリデーション:
 * - タイトルは必須
 * - 参加者は1名以上必要
 * - アジェンダは1件以上必要
 *
 * 関連ファイル:
 * - features/meeting-creation/components/* - 会議作成関連コンポーネント
 * - shared/lib/types.ts - 型定義
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, API_BASE_URL } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { generateMeetingId } from "@/lib/meetingStorage";
import { apiClient } from "@/lib/api";
import type { Meeting } from "@/lib/types";

// useSearchParams()を使用するコンポーネントを分離
function MeetingCreationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams?.get("id"); // 編集モードの場合はIDが渡される

  // -----------------------------
  // ステート
  // -----------------------------
  const [meetingId, setMeetingId] = useState<string>(() => {
    return editingId || generateMeetingId();
  });// 会議ID（編集モードの場合はeditingId、新規の場合は生成したIDを使用）
  const [title, setTitle] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [expectedOutcome, setExpectedOutcome] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>(() => {
    // 当日の日付をYYYY-MM-DD形式で初期化
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }); // YYYY-MM-DD
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState<string>("");
  const [agendaItems, setAgendaItems] = useState<Array<{
    title: string;
    duration: number;
    expectedOutcome: string;
    // relatedUrl?: string; // 任意対応のため一旦コメントアウト
  }>>([
    { title: "", duration: 15, expectedOutcome: "" }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState<boolean>(false);

  // カレンダー関連のステート
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());

  // トースト通知
  const { toasts, showError, showSuccess, removeToast } = useToast();

  // -----------------------------
  // 既存の下書きデータを読み込む
  // -----------------------------
  useEffect(() => {
    if (editingId) {
      const loadMeetingData = async () => {
        try {
          const data = await apiClient.getMeeting(editingId);
          setTitle(data.title || "");
          setPurpose(data.purpose || "");
          setExpectedOutcome(data.expectedOutcome || "");
          setMeetingDate(data.meetingDate || "");
          setParticipants(Array.isArray(data.participants) ? data.participants : []);
          setAgendaItems(
            data.agenda && data.agenda.length > 0
              ? data.agenda.map((item: any) => ({
                  title: item.title || "",
                  duration: item.duration || 10,
                  expectedOutcome: item.expectedOutcome || "",
                  // relatedUrl: item.relatedUrl || "", // 任意対応のため一旦コメントアウト
                }))
              : [{ title: "", duration: 15, expectedOutcome: "" }]
          );
        } catch (error) {
          console.error("Failed to load draft:", error);
          showError("下書きデータの読み込みに失敗しました");
        }
      };
      
      loadMeetingData();
    }
  }, [editingId]);

  // -----------------------------
  // カレンダーユーティリティ
  // -----------------------------
  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0=日曜日
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: string; day: number; isEmpty: boolean }> = [];

    // 空白日を追加
    for (let i = 0; i < startDay; i++) {
      days.push({ date: "", day: 0, isEmpty: true });
    }

    // 実際の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ date: dateStr, day, isEmpty: false });
    }

    return days;
  };

  const calendarDays = useMemo(() => {
    return generateCalendarDays(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  const isDaySelected = (date: string) => {
    return date === meetingDate;
  };

  // -----------------------------
  // バリデーション
  // -----------------------------
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "会議名を入力してください";
    }
    if (!purpose.trim()) {
      newErrors.purpose = "会議の目的を入力してください";
    }
    if (!meetingDate) {
      newErrors.meetingDate = "会議日程を選択してください";
    }
    if (participants.length === 0) {
      newErrors.participants = "参加者を1名以上追加してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleAddParticipant = () => {
    if (participantInput.trim() && !participants.includes(participantInput.trim())) {
      setParticipants([...participants, participantInput.trim()]);
      setParticipantInput("");
      // エラーをクリア
      if (errors.participants) {
        const newErrors = { ...errors };
        delete newErrors.participants;
        setErrors(newErrors);
      }
    }
  };

  const handleRemoveParticipant = (participant: string) => {
    setParticipants(participants.filter((p) => p !== participant));
  };

  const handleAddAgenda = () => {
    setAgendaItems([...agendaItems, { title: "", duration: 15, expectedOutcome: "" }]);
  };

  const handleRemoveAgenda = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const handleAgendaChange = (
    index: number,
    field: "title" | "duration" | "expectedOutcome",
    value: string | number
  ) => {
    const newAgendaItems = [...agendaItems];
    newAgendaItems[index] = { ...newAgendaItems[index], [field]: value };
    setAgendaItems(newAgendaItems);
  };

  const handleSaveDraft = async () => {
    // 下書き保存(バリデーションなし)
    try {
      const meetingData = {
        title: title || "無題の会議",
        purpose,
        expectedOutcome,
        meetingDate,
        participants: participants,
        agenda: agendaItems.map(item => ({
          id: crypto.randomUUID(),
          title: item.title,
          duration: item.duration,
          expectedOutcome: item.expectedOutcome,
          status: "pending" as const, // アジェンダ進行：未開始
          // relatedUrl: item.relatedUrl || "" // 任意対応のため一旦コメントアウト
        })),
        status: "draft" as const,
      };

      if (editingId) {
        // 編集モード：既存の会議を更新
        await apiClient.updateMeeting(editingId, meetingData);
        showSuccess("下書きを更新しました");
      } else {
        // 新規作成：生成済みのIDで会議を作成
        const meeting = await apiClient.createMeetingWithId({
          ...meetingData,
          id: meetingId
        });
        showSuccess("下書きを保存しました");
        // URLを編集モードに変更
        router.replace(`/meetings/new?id=${meetingId}`);
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      showError("下書きの保存に失敗しました");
    }
  };

  const handleStartMeeting = async () => {
    // バリデーション
    if (!validate()) {
      // エラーメッセージを収集
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        showError(errorMessages[0]); // 最初のエラーメッセージを表示
      } else {
        showError("入力内容を確認してください");
      }
      return;
    }

    // ローディング状態を開始
    setIsCreatingMeeting(true);

    try {
      // バックエンドAPIで会議を作成（既存のIDを使用）
      const meeting = await apiClient.createMeetingWithId({
        id: meetingId, // 生成済みのIDを使用
        title,
        purpose,
        expectedOutcome: expectedOutcome,
        meetingDate,
        participants: participants,
        agenda: agendaItems.map(item => ({
          id: crypto.randomUUID(),
          title: item.title,
          duration: item.duration,
          expectedOutcome: item.expectedOutcome,
          relatedUrl: undefined,
          status: "pending" as const
        }))
      });

      // 会議データをsessionStorageに保存（会議中画面で使用）
      const meetingData = {
        title,
        purpose,
        expectedOutcome,
        meetingDate,
        participants,
        agendaItems,
      };
      sessionStorage.setItem("currentMeeting", JSON.stringify(meetingData));

      // 会議進行中画面に遷移（ローディング状態は遷移先で自動的に解除される）
      router.push(`/meetings/${meetingId}/active`);

    } catch (error) {
      console.error("Failed to create meeting:", error);
      showError("会議の作成に失敗しました");
      setIsCreatingMeeting(false); // エラー時はローディング状態を解除
    }
  };

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = () => {
    setCancelModalOpen(false);
    router.push("/");
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
  };

  const handleDateFieldClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelection = (date: string) => {
    setMeetingDate(date);
    setShowCalendar(false);
    // エラーをクリア
    if (errors.meetingDate) {
      const newErrors = { ...errors };
      delete newErrors.meetingDate;
      setErrors(newErrors);
    }
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="page">
      <style suppressHydrationWarning>{commonStyles}</style>
      <style>{`
        /* ページ固有のスタイル */
        .body-content {
          padding-right: 20%;
          padding-left: 25%;
        }
        .card-body {
          padding: 24px 0;
        }
        /* 必須マークを確実に表示 */
        .form-label-required::after {
          content: " *";
          color: #F44336;
        }
        /* スピナーアニメーション */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-container">
        {/* ヘッダー */}
        <div className="meeting-header">
          <div className="meeting-title">{editingId ? "会議編集" : "新規会議作成"}</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content">
          <div className="card-body">
          {/* 会議名 */}
          <div className="form-section medium">
            <label className="form-label form-label-required">会議名</label>
            <input
              type="text"
              className={`input ${errors.title ? "input-error" : ""}`}
              placeholder="例: 週次定例会議"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // エラーをクリア
                if (errors.title) {
                  const newErrors = { ...errors };
                  delete newErrors.title;
                  setErrors(newErrors);
                }
              }}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          {/* 会議日程 */}
          <div className="form-section short" style={{ position: "relative" }}>
            <label className="form-label form-label-required">会議日程</label>
            <div
              className={`input ${errors.meetingDate ? "input-error" : ""}`}
              onClick={handleDateFieldClick}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ color: meetingDate ? "#212121" : "#9e9e9e" }}>
                {meetingDate ? formatDisplayDate(meetingDate) : "日程を選択"}
              </span>
              <span className="material-icons" style={{ fontSize: "20px", color: "#757575" }}>
                {ICONS.CALENDAR}
              </span>
            </div>
            {errors.meetingDate && <div className="error-message">{errors.meetingDate}</div>}

            {/* カレンダーポップアップ */}
            {showCalendar && (
              <>
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99,
                  }}
                  onClick={handleCalendarClose}
                />
                <div className="calendar-popup">
                  <div className="calendar-popup-header">
                    <button
                      className="btn"
                      style={{ padding: "4px 8px", minHeight: "auto" }}
                      onClick={() => {
                        const newMonth = calendarMonth - 1;
                        if (newMonth < 0) {
                          setCalendarYear(calendarYear - 1);
                          setCalendarMonth(11);
                        } else {
                          setCalendarMonth(newMonth);
                        }
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>
                        {ICONS.CHEVRON_LEFT}
                      </span>
                    </button>
                    <span>
                      {calendarYear}年{calendarMonth + 1}月
                    </span>
                    <button
                      className="btn"
                      style={{ padding: "4px 8px", minHeight: "auto" }}
                      onClick={() => {
                        const newMonth = calendarMonth + 1;
                        if (newMonth > 11) {
                          setCalendarYear(calendarYear + 1);
                          setCalendarMonth(0);
                        } else {
                          setCalendarMonth(newMonth);
                        }
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>
                        {ICONS.CHEVRON_RIGHT}
                      </span>
                    </button>
                  </div>

                  <div className="calendar-instruction">
                    日付を選択してください
                  </div>

                  <div className="calendar-grid">
                    <div className="calendar-day-header">日</div>
                    <div className="calendar-day-header">月</div>
                    <div className="calendar-day-header">火</div>
                    <div className="calendar-day-header">水</div>
                    <div className="calendar-day-header">木</div>
                    <div className="calendar-day-header">金</div>
                    <div className="calendar-day-header">土</div>

                    {calendarDays.map((day, idx) => {
                      if (day.isEmpty) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="calendar-day empty"
                          />
                        );
                      }

                      const isSelected = isDaySelected(day.date);

                      return (
                        <div
                          key={day.date}
                          className={`calendar-day ${isSelected ? "selected" : ""}`}
                          onClick={() => handleDateSelection(day.date)}
                        >
                          {day.day}
                        </div>
                      );
                    })}
                  </div>

                  {meetingDate && (
                    <div className="calendar-selected-range">
                      <span>選択日: {formatDisplayDate(meetingDate)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 会議の目的 */}
          <div className="form-section">
            <label className="form-label form-label-required">会議の目的</label>
            <textarea
              className={`textarea ${errors.purpose ? "input-error" : ""}`}
              placeholder="例: チームの進捗確認と課題の共有"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                // エラーをクリア
                if (errors.purpose) {
                  const newErrors = { ...errors };
                  delete newErrors.purpose;
                  setErrors(newErrors);
                }
              }}
            />
            {errors.purpose && <div className="error-message">{errors.purpose}</div>}
          </div>

          {/* 期待する成果物 */}
          <div className="form-section">
            <label className="form-label">期待する成果物</label>
            <textarea
              className="textarea"
              placeholder="例: 次週のアクションアイテムの決定"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
            />
          </div>

          {/* 参加者 */}
          <div className="form-section medium">
            <label className="form-label form-label-required">参加者</label>
            <div className="participant-input-row">
              <input
                type="text"
                className="input"
                placeholder="参加者名を入力"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
              />
              <button type="button" className="btn btn-primary" onClick={handleAddParticipant}>
                <span className="material-icons icon-sm">{ICONS.PLUS}</span>
                <span>追加</span>
              </button>
            </div>
            {errors.participants && <div className="error-message">{errors.participants}</div>}
            {participants.length > 0 && (
              <div className="participant-list">
                {participants.map((participant, index) => (
                  <div key={index} className="tag tag-removable">
                    <span>{participant}</span>
                    <span
                      className="material-icons tag-close"
                      onClick={() => handleRemoveParticipant(participant)}
                      role="button"
                      aria-label="削除"
                      style={{ fontSize: "16px", cursor: "pointer" }}
                    >
                      {ICONS.CLOSE}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アジェンダ */}
          <div className="form-section">
            <div className="flex justify-between items-center mb-3">
              <label className="form-label" style={{ marginBottom: 0 }}>アジェンダ</label>
              <button type="button" className="btn btn-primary" onClick={handleAddAgenda}>
                <span className="material-icons icon-sm">{ICONS.PLUS}</span>
                <span>アジェンダ追加</span>
              </button>
            </div>
            {agendaItems.map((item, index) => (
              <div key={index} className="agenda-item">
                <div className="agenda-header">
                  <div className="agenda-title">アジェンダ {index + 1}</div>
                  {agendaItems.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleRemoveAgenda(index)}
                    >
                      <span className="material-icons icon-sm">{ICONS.TRASH}</span>
                      <span>削除</span>
                    </button>
                  )}
                </div>
                <div className="agenda-row">
                  <div className="form-group">
                    <label className="form-label">議題</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="例: 前週の振り返り"
                      value={item.title}
                      onChange={(e) => handleAgendaChange(index, "title", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">時間(分)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={item.duration}
                      onChange={(e) => handleAgendaChange(index, "duration", parseInt(e.target.value) || 15)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">期待する成果</label>
                  <textarea
                    className="textarea"
                    placeholder="例: 前週の課題を整理し、改善策を決定する"
                    value={item.expectedOutcome}
                    onChange={(e) => handleAgendaChange(index, "expectedOutcome", e.target.value)}
                    style={{ minHeight: "80px" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="action-buttons">
            <button type="button" className="btn" onClick={handleCancelClick}>
              キャンセル
            </button>
            <div className="action-buttons-right">
              <button type="button" className="btn" onClick={handleSaveDraft}>
                下書き保存
              </button>
              <button type="button" className="btn btn-success btn-large" onClick={handleStartMeeting}>
                会議作成
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* キャンセル確認モーダル */}
      {cancelModalOpen && (
        <div className="modal-overlay" onClick={handleCancelModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">入力内容を破棄</div>
            <div className="modal-body">
              入力内容を破棄して一覧画面に戻りますか?
              <br />
              この操作は元に戻せません。
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleCancelModalClose}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={handleCancelConfirm}>
                破棄して戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会議作成中ローディング */}
      {isCreatingMeeting && (
        <div className="modal-overlay" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "32px 48px",
            textAlign: "center",
            maxWidth: "400px",
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
                borderTop: "4px solid #2196F3",
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
              会議を作成しています
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

// Suspense境界でラップしたデフォルトエクスポート
export default function MeetingCreationPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        読み込み中...
      </div>
    }>
      <MeetingCreationForm />
    </Suspense>
  );
}
