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

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS } from "@/lib/constants";

export default function MeetingCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams?.get("id"); // 編集モードの場合はIDが渡される
  const dateInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------
  // ステート
  // -----------------------------
  const [title, setTitle] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [expectedOutcome, setExpectedOutcome] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>(""); // YYYY-MM-DD
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState<string>("");
  const [agendaItems, setAgendaItems] = useState<Array<{
    title: string;
    duration: number;
    expectedOutcome: string;
  }>>([
    { title: "", duration: 15, expectedOutcome: "" }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);

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

  const handleSaveDraft = () => {
    // 下書き保存(バリデーションなし)
    console.log("下書き保存:", { title, purpose, expectedOutcome, meetingDate, participants, agendaItems });
    alert("下書きとして保存しました");
    router.push("/");
  };

  const handleStartMeeting = () => {
    // バリデーション
    if (!validate()) {
      alert("入力内容を確認してください");
      return;
    }

    // 会議作成
    console.log("会議作成:", { title, purpose, expectedOutcome, meetingDate, participants, agendaItems });

    // TODO: API呼び出してIDを取得
    const mockMeetingId = "new-meeting-id";

    // 会議中画面へ遷移
    router.push(`/meetings/${mockMeetingId}/active`);
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
    // 枠内クリックでカレンダーを開く
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
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
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          {/* 会議日程 */}
          <div className="form-section short">
            <label className="form-label form-label-required">会議日程</label>
            <input
              ref={dateInputRef}
              type="date"
              className={`input ${errors.meetingDate ? "input-error" : ""}`}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              onClick={handleDateFieldClick}
            />
            {errors.meetingDate && <div className="error-message">{errors.meetingDate}</div>}
          </div>

          {/* 会議の目的 */}
          <div className="form-section">
            <label className="form-label form-label-required">会議の目的</label>
            <textarea
              className={`textarea ${errors.purpose ? "input-error" : ""}`}
              placeholder="例: チームの進捗確認と課題の共有"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
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
                      className="tag-close"
                      onClick={() => handleRemoveParticipant(participant)}
                      role="button"
                      aria-label="削除"
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
    </div>
  );
}
