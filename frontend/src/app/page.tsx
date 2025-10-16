"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { commonStyles } from "@/styles/commonStyles";
import { ICONS, DOWNLOAD_FORMAT_LABELS } from "@/lib/constants";

/**
 * トップページ: 議事録履歴一覧
 *
 * 機能:
 * - 会議履歴の一覧表示(データグリッド形式)
 * - ステータス・期間・キーワードによるフィルタリング
 * - カレンダーでの期間選択
 * - ページネーション
 * - ダウンロード(Excel/音声ファイル選択式)
 * - 削除(モーダル確認)
 * - 会議名リンク(完了→レポート画面、下書き→作成画面)
 */
export default function MeetingHistoryPage() {
  const router = useRouter();

  // -----------------------------
  // 型定義
  // -----------------------------
  type Status = "完了" | "下書き";

  type Meeting = {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    participants: string;
    status: Status;
  };

  // -----------------------------
  // ダミーデータ
  // -----------------------------
  const initialData: Meeting[] = [
    {
      id: "a1",
      date: "2025-10-07",
      title: "要件すり合わせ",
      participants: "田中、佐藤、鈴木、山田",
      status: "完了",
    },
    {
      id: "a2",
      date: "2025-10-05",
      title: "API設計レビュー",
      participants: "田中、高橋、伊藤",
      status: "完了",
    },
    {
      id: "a3",
      date: "2025-10-03",
      title: "週次進捗確認",
      participants: "田中、佐藤、鈴木、山田、伊藤",
      status: "完了",
    },
    {
      id: "a4",
      date: "2025-10-01",
      title: "認証方式検討会議",
      participants: "田中、高橋、佐藤",
      status: "下書き",
    },
    {
      id: "a5",
      date: "2025-09-28",
      title: "スプリント計画",
      participants: "全員(8名)",
      status: "完了",
    },
    {
      id: "a6",
      date: "2025-09-25",
      title: "DB設計レビュー",
      participants: "佐藤、伊藤、山田",
      status: "下書き",
    },
  ];

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
  // 確定した検索条件（フィルタリングに使用）
  const [statusFilter, setStatusFilter] = useState<"すべてのステータス" | Status>(
    "すべてのステータス"
  );
  const [keyword, setKeyword] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("");
  const [dateRangeTo, setDateRangeTo] = useState<string>("");

  // 入力中の検索条件（一時的）
  const [tempStatusFilter, setTempStatusFilter] = useState<"すべてのステータス" | Status>(
    "すべてのステータス"
  );
  const [tempKeyword, setTempKeyword] = useState<string>("");
  const [tempDateRange, setTempDateRange] = useState<string>("");
  const [tempDateRangeTo, setTempDateRangeTo] = useState<string>("");

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarSelectionMode, setCalendarSelectionMode] = useState<"start" | "end" | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

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
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0=1月

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
    return initialData.filter((row) => {
      if (!inRange(row.date)) return false;
      if (statusFilter !== "すべてのステータス") {
        if (row.status !== statusFilter) return false;
      }
      if (kw) {
        const hay = `${row.title} ${row.participants}`.toLowerCase();
        if (!hay.includes(kw.toLowerCase())) return false;
      }
      return true;
    });
  }, [statusFilter, keyword, dateRange, dateRangeTo]);

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
  };

  const handleSearch = () => {
    // 一時的な検索条件を確定
    setStatusFilter(tempStatusFilter);
    setKeyword(tempKeyword);
    setDateRange(tempDateRange);
    setDateRangeTo(tempDateRangeTo);
    setPage(1);
  };

  const handlePrev = () => setPage((p) => clamp(p - 1, 1, totalPages));
  const handleNext = () => setPage((p) => clamp(p + 1, 1, totalPages));

  const handleNewMeeting = () => {
    router.push("/meetings/new");
  };

  const handleTitleClick = (meeting: Meeting) => {
    if (meeting.status === "完了") {
      // 完了済みの会議はレポート画面へ
      router.push(`/meetings/${meeting.id}/summary`);
    } else {
      // 下書きの会議は作成画面へ(編集モード)
      router.push(`/meetings/new?id=${meeting.id}`);
    }
  };

  const handleDownload = (meetingId: string, format: "excel" | "audio") => {
    console.log(`ダウンロード: ${meetingId}, 形式: ${format}`);
    alert(`${DOWNLOAD_FORMAT_LABELS[format]}をダウンロードします`);
    setDropdownOpen(null);
  };

  const handleDeleteClick = (meeting: Meeting) => {
    setDeletingMeeting(meeting);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingMeeting) {
      console.log(`削除: ${deletingMeeting.id}`);
      alert("削除しました");
      setDeleteModalOpen(false);
      setDeletingMeeting(null);
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
      setCalendarSelectionMode("start");
      // カレンダーを開く時に、確定済みの日付を一時的な状態にコピー
      setTempDateRange(dateRange);
      setTempDateRangeTo(dateRangeTo);
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
      setShowCalendar(false);
      setCalendarSelectionMode(null);
    }
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
    setCalendarSelectionMode(null);
  };

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="page">
      <style>{commonStyles}</style>
      <style>{`

        /* データグリッドスタイル */
        .data-grid {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }
        .data-grid thead {
          background: #FAFAFA;
          border-bottom: 2px solid #E0E0E0;
        }
        .data-grid th {
          color: #616161;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          padding: 16px 12px;
          text-align: left;
          letter-spacing: 0.5px;
        }
        .data-grid tbody tr {
          border-bottom: 1px solid #EEEEEE;
          transition: background-color 0.2s ease;
        }
        .data-grid tbody tr:hover {
          background: #F5F5F5;
        }
        .data-grid td {
          padding: 16px 12px;
          color: #424242;
          font-size: 14px;
        }

        /* 検索セクションのスタイル */
        .search-section {
          padding: 24px 0;
          border-bottom: 1px solid #E0E0E0;
          background: #FAFAFA;
        }
        .search-fields {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: flex-end;
        }
        .search-field {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .search-field-label {
          font-size: 12px;
          font-weight: 500;
          color: #424242;
        }
        .search-field.with-icon {
          position: relative;
        }
        .search-field.with-icon input {
          padding-right: 40px;
        }
        .search-field .calendar-icon {
          position: absolute;
          right: 12px;
          bottom: 10px;
          cursor: pointer;
          color: #757575;
          transition: color 0.2s ease;
        }
        .search-field .calendar-icon:hover {
          color: #2196F3;
        }
        .search-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .title-link {
          color: #2196F3;
          text-decoration: none;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .title-link:hover {
          color: #1976D2;
          text-decoration: underline;
        }
        .ops {
          display: flex;
          gap: 12px;
          color: #757575;
        }
        .ops .icon {
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
          font-size: 20px;
        }
        .ops .icon:hover {
          transform: scale(1.15);
          color: #424242;
        }
        .new-meeting-row {
          display: flex;
          justify-content: flex-end;
          padding: 16px 0;
          border-bottom: 1px solid #E0E0E0;
        }

        /* カレンダーポップアップ(範囲選択版) */
        .calendar-popup {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: #fff;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 16px;
          z-index: 100;
          min-width: 320px;
        }
        .calendar-popup-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #424242;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .calendar-instruction {
          font-size: 12px;
          color: #757575;
          margin-bottom: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 8px;
        }
        .calendar-day-header {
          text-align: center;
          font-size: 11px;
          color: #757575;
          font-weight: 600;
          padding: 8px 4px;
        }
        .calendar-day {
          text-align: center;
          padding: 8px 4px;
          font-size: 13px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .calendar-day:hover {
          background: #e3f2fd;
        }
        .calendar-day.selected {
          background: #2196F3;
          color: #fff;
          font-weight: 600;
        }
        .calendar-day.in-range {
          background: #e3f2fd;
          color: #1565C0;
        }
        .calendar-day.empty {
          cursor: default;
          opacity: 0.3;
        }
        .calendar-day.empty:hover {
          background: transparent;
        }
        .calendar-selected-range {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 13px;
        }
        .calendar-selected-range span {
          color: #424242;
        }

        /* フッタースタイル */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-top: 1px solid #E0E0E0;
          background: #FAFAFA;
          flex-wrap: wrap;
          gap: 12px;
        }
        .page-info {
          color: #757575;
          font-size: 13px;
        }
        .pager {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .page-link {
          border: 1px solid #E0E0E0;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          background: #fff;
          transition: all 0.2s ease;
          min-width: 36px;
          text-align: center;
          font-size: 14px;
        }
        .page-link:hover:not(:disabled) {
          background: #F5F5F5;
          border-color: #2196F3;
        }
        .page-link.active {
          background: #2196F3;
          color: #fff;
          border-color: #2196F3;
        }
        .page-link:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }
        .page-size {
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          padding: 6px 10px;
          background: #fff;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .search-fields {
            flex-direction: column;
          }
          .footer {
            flex-direction: column;
          }
        }
      `}</style>
      <div className="page-container">
        {/* ヘッダー */}
        <div className="meeting-header">
          <div className="meeting-title">議事録履歴一覧</div>
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

        {/* データグリッド */}
        <div className="table-wrap">
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
                  <tr key={row.id}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      <a
                        className="title-link"
                        onClick={() => handleTitleClick(row)}
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
                            onClick={() => toggleDropdown(row.id)}
                          >
                            {ICONS.DOWNLOAD}
                          </span>
                          {dropdownOpen === row.id && (
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
                          )}
                        </div>
                        {/* 削除ボタン */}
                        <span
                          className="icon material-icons icon-sm"
                          role="button"
                          aria-label="削除"
                          onClick={() => handleDeleteClick(row)}
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
    </div>
  );
}
