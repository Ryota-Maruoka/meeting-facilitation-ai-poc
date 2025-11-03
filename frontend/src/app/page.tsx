"use client";

/**
 * ========================================
 * ページ: 会議履歴一覧（トップページ）
 * ========================================
 *
 * URL: /
 *
 * このページについて:
 * - アプリケーションのトップページ
 * - 過去の会議の一覧を表示
 * - 検索・フィルタリング・ページネーション機能を提供
 *
 * 主な機能:
 * - 会議履歴の一覧表示（テーブル形式）
 * - ステータス・期間・キーワードによるフィルタリング
 * - カレンダーでの期間選択
 * - ページネーション（10件/20件/50件表示切り替え）
 * - ダウンロード（Excel/音声ファイル選択式）
 * - 削除（確認モーダル表示）
 * - 会議名クリック（完了→サマリー画面、下書き→作成画面へ遷移）
 *
 * 関連ファイル:
 * - features/meeting-history/components/* - 会議履歴関連コンポーネント
 * - lib/types.ts - 型定義
 * - shared/lib/utils.ts - ユーティリティ関数
 */

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";
import Toast from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { apiClient } from "@/lib/api";
import type { Meeting, MeetingDetailPreview } from "@/lib/types";

export default function MeetingHistoryPage() {
  const router = useRouter();

  // -----------------------------
  // 型定義
  // -----------------------------
  type Status = "完了" | "下書き";

  type DisplayMeeting = {
    id: string;
    meetingDate: string; // YYYY-MM-DD
    title: string;
    participants: string;
    status: Status;
  };

  // -----------------------------
  // 会議データ
  // -----------------------------
  const [initialData, setInitialData] = useState<DisplayMeeting[]>([]);

  // 会議データを取得
  useEffect(() => {
    async function fetchMeetings() {
      try {
        const meetings = await apiClient.getMeetings();

        // APIのデータ形式を画面表示用に変換
        const formattedMeetings = meetings.map((m: Meeting): DisplayMeeting => {
          // participantsが配列かどうか確認
          const participantsStr = Array.isArray(m.participants)
            ? m.participants.join("、")
            : typeof m.participants === "string"
            ? m.participants
            : "";

          return {
            id: m.id,
            meetingDate: m.meetingDate || m.created_at || "", // meetingDateフィールドがなければcreated_atを使用、それもなければ空文字
            title: m.title,
            participants: participantsStr,
            status: m.status === "completed" ? "完了" : "下書き", // APIのステータスを日本語に変換
          };
        });

        setInitialData(formattedMeetings);
      } catch (error) {
        console.error("Failed to fetch meetings:", error);
      }
    }
    fetchMeetings();
  }, []);

  // -----------------------------
  // フィルタ用定数
  // -----------------------------
  const STATUS_OPTIONS: Array<"すべてのステータス" | Status> = [
    "すべてのステータス",
    "完了",
    "下書き",
  ];

  // -----------------------------
  // ステート
  // -----------------------------
  // 確定した検索条件（フィルタリングに使用）- sessionStorageから復元
  const [statusFilter, setStatusFilter] = useState<"すべてのステータス" | Status>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("meetingHistory_statusFilter");
      return (saved as "すべてのステータス" | Status) || "すべてのステータス";
    }
    return "すべてのステータス";
  });
  const [keyword, setKeyword] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("meetingHistory_keyword") || "";
    }
    return "";
  });
  const [dateRange, setDateRange] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("meetingHistory_dateRange") || "";
    }
    return "";
  });
  const [dateRangeTo, setDateRangeTo] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("meetingHistory_dateRangeTo") || "";
    }
    return "";
  });

  // 入力中の検索条件（一時的）- 確定値から初期化
  const [tempStatusFilter, setTempStatusFilter] = useState<"すべてのステータス" | Status>(statusFilter);
  const [tempKeyword, setTempKeyword] = useState<string>(keyword);
  const [tempDateRange, setTempDateRange] = useState<string>(dateRange);
  const [tempDateRangeTo, setTempDateRangeTo] = useState<string>(dateRangeTo);

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarSelectionMode, setCalendarSelectionMode] = useState<"start" | "end" | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingMeeting, setDeletingMeeting] = useState<DisplayMeeting | null>(null);

  // プレビューパネル用の状態
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<MeetingDetailPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // トースト通知
  const { toasts, showSuccess, markAsClosing, removeToastDelayed } = useToast();

  // -----------------------------
  // ユーティリティ関数
  // -----------------------------
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const inRange = (iso: string) => {
    // 日付範囲が設定されていない場合は全て表示
    if (!dateRange && !dateRangeTo) return true;

    const t = new Date(iso);

    // 開始日のみ設定されている場合
    if (dateRange && !dateRangeTo) {
      const from = new Date(dateRange);
      return t >= from;
    }

    // 終了日のみ設定されている場合
    if (!dateRange && dateRangeTo) {
      const to = new Date(dateRangeTo);
      return t <= to;
    }

    // 両方設定されている場合
    const from = new Date(dateRange);
    const to = new Date(dateRangeTo);
    return t >= from && t <= to;
  };

  // カレンダー用の日付生成
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

  // カレンダーの年月（当月を初期値に）
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth()); // 0=1月

  const calendarDays = useMemo(() => {
    return generateCalendarDays(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  const isDayInRange = (date: string) => {
    if (!date || !tempDateRange || !tempDateRangeTo) return false;
    const d = new Date(date);
    const start = new Date(tempDateRange);
    const end = new Date(tempDateRangeTo);
    return d >= start && d <= end;
  };

  const isDaySelected = (date: string) => {
    return date === tempDateRange || date === tempDateRangeTo;
  };

  // -----------------------------
  // フィルタ適用
  // -----------------------------
  const filtered = useMemo(() => {
    const kw = keyword.trim();
    const result = initialData.filter((row) => {
      if (!inRange(row.meetingDate)) return false;
      if (statusFilter !== "すべてのステータス") {
        if (row.status !== statusFilter) return false;
      }
      if (kw) {
        const hay = `${row.title} ${row.participants}`.toLowerCase();
        if (!hay.includes(kw.toLowerCase())) return false;
      }
      return true;
    });
    return result;
  }, [initialData, statusFilter, keyword, dateRange, dateRangeTo]);

  // -----------------------------
  // ページネーション
  // -----------------------------
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = clamp(page, 1, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageRows = filtered.slice(startIdx, endIdx);

  // -----------------------------
  // イベントハンドラ
  // -----------------------------
  const handleClear = () => {
    // 確定値をクリア
    setStatusFilter("すべてのステータス");
    setKeyword("");
    setDateRange("");
    setDateRangeTo("");
    // 一時的な値もクリア
    setTempStatusFilter("すべてのステータス");
    setTempKeyword("");
    setTempDateRange("");
    setTempDateRangeTo("");
    setPage(1);

    // sessionStorageからも削除
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("meetingHistory_statusFilter");
      sessionStorage.removeItem("meetingHistory_keyword");
      sessionStorage.removeItem("meetingHistory_dateRange");
      sessionStorage.removeItem("meetingHistory_dateRangeTo");
    }
  };

  const handleSearch = () => {
    // 一時的な検索条件を確定
    setStatusFilter(tempStatusFilter);
    setKeyword(tempKeyword);
    setDateRange(tempDateRange);
    setDateRangeTo(tempDateRangeTo);
    setPage(1);

    // sessionStorageに保存
    if (typeof window !== "undefined") {
      sessionStorage.setItem("meetingHistory_statusFilter", tempStatusFilter);
      sessionStorage.setItem("meetingHistory_keyword", tempKeyword);
      sessionStorage.setItem("meetingHistory_dateRange", tempDateRange);
      sessionStorage.setItem("meetingHistory_dateRangeTo", tempDateRangeTo);
    }
  };

  const handlePrev = () => setPage((p) => clamp(p - 1, 1, totalPages));
  const handleNext = () => setPage((p) => clamp(p + 1, 1, totalPages));

  const handleNewMeeting = () => {
    router.push("/meetings/new");
  };

  const handleTitleClick = (meeting: DisplayMeeting) => {
    if (meeting.status === "完了") {
      // 完了済みの会議はレポート画面へ
      router.push(`/meetings/${meeting.id}/summary`);
    } else {
      // 下書きの会議は作成画面へ(編集モード)
      router.push(`/meetings/new?id=${meeting.id}`);
    }
  };

  const handleDownload = (_meetingId: string, format: "excel" | "audio") => {
    showSuccess(`${DOWNLOAD_FORMAT_LABELS[format]}をダウンロードします`);
    setDropdownOpen(null);
  };

  const handleDeleteClick = (meeting: DisplayMeeting) => {
    setDeletingMeeting(meeting);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMeeting) {
      try {
        // バックエンドAPIで削除
        await apiClient.deleteMeeting(deletingMeeting.id);

        // 画面上のデータも更新
        setInitialData((prev) => prev.filter((m) => m.id !== deletingMeeting.id));

        showSuccess("会議を削除しました");
      } catch (error) {
        console.error("Failed to delete meeting:", error);
      } finally {
        setDeleteModalOpen(false);
        setDeletingMeeting(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeletingMeeting(null);
  };

  const toggleDropdown = (meetingId: string) => {
    setDropdownOpen((prev) => (prev === meetingId ? null : meetingId));
  };

  const handleDateFieldClick = () => {
    if (!showCalendar) {
      // カレンダーを開く時に、確定済みの日付を一時的な状態にコピー
      // 日付が未選択の場合は当日の日付を設定し、終了日選択モードに
      if (!dateRange && !dateRangeTo) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;
        setTempDateRange(todayStr);
        setTempDateRangeTo("");
        setCalendarSelectionMode("end"); // 終了日選択モードに設定
      } else {
        setTempDateRange(dateRange);
        setTempDateRangeTo(dateRangeTo);
        setCalendarSelectionMode("start"); // 既存の日付がある場合は開始日から
      }
    }
    setShowCalendar(!showCalendar);
  };

  const handleDateSelection = (date: string) => {
    if (calendarSelectionMode === "start") {
      setTempDateRange(date);
      setCalendarSelectionMode("end");
    } else if (calendarSelectionMode === "end") {
      // 終了日が開始日より前の場合は入れ替える
      if (new Date(date) < new Date(tempDateRange)) {
        setTempDateRangeTo(tempDateRange);
        setTempDateRange(date);
      } else {
        setTempDateRangeTo(date);
      }
      // カレンダーは閉じずに、選択モードを維持
      // setShowCalendar(false);
      // setCalendarSelectionMode(null);
    }
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
    setCalendarSelectionMode(null);
  };

  // プレビューパネル関連のハンドラ
  const handleRowClick = async (meeting: DisplayMeeting) => {
    // 完了済みの会議のみプレビュー表示
    if (meeting.status !== "完了") {
      return;
    }

    setSelectedMeetingId(meeting.id);
    setIsLoadingPreview(true);

    try {
      const detail = await apiClient.getMeetingDetailPreview(meeting.id);
      setPreviewDetail(detail);
    } catch (error) {
      console.error("Failed to load preview:", error);
      setPreviewDetail(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setSelectedMeetingId(null);
    setPreviewDetail(null);
  };

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="page meeting-history-page">
      <style suppressHydrationWarning>{commonStyles}</style>
      <div className="page-container">
        {/* ヘッダー */}
        <div className="meeting-header">
          <div className="meeting-title">会議履歴一覧</div>
        </div>

        {/* ボディコンテンツ */}
        <div className="body-content">
          {/* 検索セクション */}
          <div className="search-section">
          <div className="search-fields">
            {/* 会議名・内容を検索 */}
            <div className="search-field">
              <label className="search-field-label">会議名・内容</label>
              <input
                className="input"
                placeholder="会議名・内容を検索"
                value={tempKeyword}
                onChange={(e) => setTempKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                aria-label="会議名・内容を検索"
              />
            </div>

            {/* 期間 */}
            <div className="search-field with-icon" style={{ position: "relative" }}>
              <label className="search-field-label">期間</label>
              <input
                className="input"
                type="text"
                value={tempDateRange && tempDateRangeTo ? `${tempDateRange} ~ ${tempDateRangeTo}` : ""}
                readOnly
                placeholder="期間を選択"
                aria-label="期間"
                onClick={handleDateFieldClick}
                style={{ cursor: "pointer" }}
              />
              <span
                className="material-icons icon-sm calendar-icon"
                onClick={handleDateFieldClick}
              >
                {ICONS.CALENDAR}
              </span>
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
                        <span className="material-icons icon-sm">{ICONS.CHEVRON_LEFT}</span>
                      </button>
                      <span>{calendarYear}年{calendarMonth + 1}月</span>
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
                        <span className="material-icons icon-sm">{ICONS.CHEVRON_RIGHT}</span>
                      </button>
                    </div>
                    <div className="calendar-instruction">
                      {calendarSelectionMode === "start" ? "開始日を選択してください" : "終了日を選択してください"}
                    </div>
                    <div className="calendar-grid">
                      <div className="calendar-day-header">日</div>
                      <div className="calendar-day-header">月</div>
                      <div className="calendar-day-header">火</div>
                      <div className="calendar-day-header">水</div>
                      <div className="calendar-day-header">木</div>
                      <div className="calendar-day-header">金</div>
                      <div className="calendar-day-header">土</div>
                      {calendarDays.map((dayInfo, idx) => (
                        <div
                          key={idx}
                          className={`calendar-day ${
                            dayInfo.isEmpty
                              ? "empty"
                              : isDaySelected(dayInfo.date)
                              ? "selected"
                              : isDayInRange(dayInfo.date)
                              ? "in-range"
                              : ""
                          }`}
                          onClick={() => !dayInfo.isEmpty && handleDateSelection(dayInfo.date)}
                        >
                          {dayInfo.isEmpty ? "" : dayInfo.day}
                        </div>
                      ))}
                    </div>
                    {(tempDateRange || tempDateRangeTo) && (
                      <div className="calendar-selected-range">
                        <span>選択中: {tempDateRange || "未選択"} ~ {tempDateRangeTo || "未選択"}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ステータス */}
            <div className="search-field">
              <label className="search-field-label">ステータス</label>
              <select
                className="select"
                value={tempStatusFilter}
                onChange={(e) => {
                  setTempStatusFilter(e.target.value as typeof tempStatusFilter);
                }}
                aria-label="ステータス"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 検索・クリアボタン */}
          <div className="search-buttons">
            <button className="btn btn-primary" onClick={handleSearch}>
              <span className="material-icons icon-sm">{ICONS.SEARCH}</span>
              <span>検索</span>
            </button>
            <button className="btn" onClick={handleClear}>
              <span className="material-icons icon-sm">{ICONS.FILTER}</span>
              <span>クリア</span>
            </button>
          </div>
        </div>

        {/* 新規会議作成ボタン */}
        <div className="new-meeting-row">
          <button className="btn btn-primary" onClick={handleNewMeeting}>
            <span className="material-icons icon-sm">{ICONS.PLUS}</span>
            <span>新規会議作成</span>
          </button>
        </div>

        {/* データグリッドとプレビューパネルのコンテナ */}
        <div className="meeting-history-container">
          {/* プレビュー表示時のオーバーレイ(背景クリックで閉じる) */}
          {selectedMeetingId && (
            <div
              className="preview-overlay"
              onClick={handleClosePreview}
            />
          )}

          {/* 左側: データグリッド */}
          <div className={`table-wrap ${selectedMeetingId ? "with-preview" : ""}`}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>会議名</th>
                  <th>参加者</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                      <span className="text-secondary">該当するデータがありません。</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`${row.status === "完了" ? "clickable-row" : ""} ${selectedMeetingId === row.id ? "selected-row" : ""}`}
                      onClick={() => row.status === "完了" && handleRowClick(row)}
                    >
                      <td>{formatDate(row.meetingDate)}</td>
                      <td>
                        <a
                          className="title-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTitleClick(row);
                          }}
                        >
                          {row.title}
                        </a>
                      </td>
                      <td>{row.participants}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.status === "完了" ? "badge-success" : "badge-default"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div className="ops">
                          {/* ダウンロードボタン(プルダウン) */}
                          <div className="dropdown">
                            <span
                              className="icon material-icons icon-sm"
                              role="button"
                              aria-label="ダウンロード"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(row.id);
                              }}
                            >
                              {ICONS.DOWNLOAD}
                            </span>
                            {dropdownOpen === row.id && (
                              <>
                                {/* 画面外クリック用の背景オーバーレイ */}
                                <div
                                  style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 99,
                                  }}
                                  onClick={() => setDropdownOpen(null)}
                                />
                                <div className="dropdown-menu">
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleDownload(row.id, "excel")}
                                  >
                                    {DOWNLOAD_FORMAT_LABELS.excel}
                                  </button>
                                  <div className="dropdown-divider"></div>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleDownload(row.id, "audio")}
                                  >
                                    {DOWNLOAD_FORMAT_LABELS.audio}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          {/* 削除ボタン */}
                          <span
                            className="icon material-icons icon-sm"
                            role="button"
                            aria-label="削除"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(row);
                            }}
                          >
                            {ICONS.TRASH}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 右側: プレビューパネル */}
          {selectedMeetingId && (
            <div className="preview-panel" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h3 className="preview-title">
                  {pageRows.find(m => m.id === selectedMeetingId)?.title || "会議詳細"}
                </h3>
                <button
                  className="preview-close-btn"
                  onClick={handleClosePreview}
                  aria-label="プレビューを閉じる"
                >
                  <span className="material-icons icon-sm">{ICONS.CLOSE}</span>
                </button>
              </div>

              <div className="preview-body">
                {isLoadingPreview ? (
                  <div className="preview-loading">
                    <div className="spinner"></div>
                    <p>読み込み中...</p>
                  </div>
                ) : previewDetail ? (
                  <>
                    {/* 基本情報 */}
                    <div className="preview-meta">
                      <div className="preview-meta-item">
                        <span className="material-icons icon-sm">{ICONS.CALENDAR}</span>
                        <span>{formatDate(pageRows.find(m => m.id === selectedMeetingId)?.meetingDate || "")}</span>
                      </div>
                      <div className="preview-meta-item">
                        <span className="material-icons icon-sm">{ICONS.GROUP}</span>
                        <span>{pageRows.find(m => m.id === selectedMeetingId)?.participants || ""}</span>
                      </div>
                    </div>

                    {/* 要約 */}
                    <div className="preview-section">
                      <h4 className="preview-section-title">
                        <span className="material-icons icon-sm">description</span>
                        要約
                      </h4>
                      <div className="preview-summary">
                        {previewDetail.summary || "要約がありません"}
                      </div>
                    </div>

                    {/* 決定事項 */}
                    <div className="preview-section">
                      <h4 className="preview-section-title">
                        <span className="material-icons icon-sm">check_circle</span>
                        決定事項
                        {previewDetail.decisions.length > 3 && (
                          <span className="preview-count">+{previewDetail.decisions.length - 3}件</span>
                        )}
                      </h4>
                      {previewDetail.decisions.length > 0 ? (
                        <ul className="preview-list preview-decisions">
                          {previewDetail.decisions.slice(0, 3).map((decision, idx) => (
                            <li key={idx}>{decision}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="preview-empty">決定事項はありません</p>
                      )}
                    </div>

                    {/* アクションアイテム */}
                    <div className="preview-section">
                      <h4 className="preview-section-title">
                        <span className="material-icons icon-sm">assignment</span>
                        アクションアイテム
                        {previewDetail.actions.length > 3 && (
                          <span className="preview-count">+{previewDetail.actions.length - 3}件</span>
                        )}
                      </h4>
                      {previewDetail.actions.length > 0 ? (
                        <ul className="preview-list preview-actions">
                          {previewDetail.actions.slice(0, 3).map((action, idx) => (
                            <li key={idx}>
                              <div className="action-title">{action.title}</div>
                              <div className="action-meta">
                                {action.owner && <span className="action-owner">担当: {action.owner}</span>}
                                {action.due && <span className="action-due">期限: {action.due}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="preview-empty">アクションアイテムはありません</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="preview-error">
                    <p>詳細情報を読み込めませんでした</p>
                  </div>
                )}
              </div>

              <div className="preview-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => selectedMeetingId && router.push(`/meetings/${selectedMeetingId}/summary`)}
                >
                  <span className="material-icons icon-sm">open_in_new</span>
                  <span>詳細レポートを開く</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* フッター(ページネーション) */}
        <div className="footer">
          <div className="page-info">
            全{initialData.length}件中 {total === 0 ? 0 : startIdx + 1}-{endIdx}件を表示
          </div>

          <div className="flex items-center gap-3">
            <select
              className="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}件/ページ
                </option>
              ))}
            </select>

            <div className="pager">
              <button
                className="page-link"
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="前のページ"
              >
                <span className="material-icons icon-sm">{ICONS.CHEVRON_LEFT}</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                const pageNo = idx + 1;
  return (
                  <button
                    key={pageNo}
                    className={`page-link ${pageNo === currentPage ? "active" : ""}`}
                    onClick={() => setPage(pageNo)}
                  >
                    {pageNo}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="ellipsis">...</span>}
              <button
                className="page-link"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="次のページ"
              >
                <span className="material-icons icon-sm">{ICONS.CHEVRON_RIGHT}</span>
              </button>
            </div>
          </div>
        </div>
            </div>
          </div>

      {/* 削除確認モーダル */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">会議を削除</div>
            <div className="modal-body">
              「{deletingMeeting?.title}」を削除してもよろしいですか?
              <br />
              この操作は元に戻せません。
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleDeleteCancel}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                削除
              </button>
          </div>
        </div>
      </div>
      )}

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
