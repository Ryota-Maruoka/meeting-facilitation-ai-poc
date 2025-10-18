/**
 * 定数定義
 * 
 * アプリケーション全体で使用する定数を集約
 */

// API設定
// 本番環境では /api (リライトでバックエンドにプロキシ)
// 開発環境では http://localhost:8000 (直接アクセス)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 会議設定
export const MAX_MEETING_DURATION_MINUTES = 180;
export const DEFAULT_AGENDA_DURATION_MINUTES = 15;
export const MINI_SUMMARY_INTERVAL_SECONDS = 180; // 3分

// 脱線検知設定
export const DEVIATION_THRESHOLD = 0.3;
export const DEVIATION_CONSECUTIVE_CHUNKS = 3;

// UI設定
export const DEFAULT_PAGE_SIZE = 20;
export const DEBOUNCE_DELAY_MS = 300;

// 会議ステータス
export const MEETING_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

// ステータス表示名
export const STATUS_LABELS = {
  draft: "下書き",
  active: "会議中",
  completed: "完了",
} as const;

// アジェンダステータス
export const AGENDA_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

// アクションステータス
export const ACTION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

// 優先度
export const PRIORITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

// テンプレート
export const MEETING_TEMPLATES = [
  "要件定義",
  "設計レビュー", 
  "定例会議",
  "ふりかえり",
  "意思決定会議",
  "進捗確認",
] as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "ネットワークエラーが発生しました",
  SERVER_ERROR: "サーバーエラーが発生しました",
  VALIDATION_ERROR: "入力内容に誤りがあります",
  UNAUTHORIZED: "認証が必要です",
  NOT_FOUND: "リソースが見つかりません",
  UNKNOWN_ERROR: "予期しないエラーが発生しました",
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  MEETING_CREATED: "会議が作成されました",
  MEETING_UPDATED: "会議が更新されました",
  MEETING_DELETED: "会議が削除されました",
  DECISION_ADDED: "決定事項が追加されました",
  ACTION_ADDED: "アクションが追加されました",
  SUMMARY_GENERATED: "サマリが生成されました",
} as const;

// Material Icons（アイコン名）
export const ICONS = {
  IMPORT: "file_download",
  EXPORT: "file_upload",
  PLUS: "add",
  SEARCH: "search",
  FILTER: "filter_list",
  VIEW: "visibility",
  EDIT: "edit",
  COPY: "content_copy",
  TRASH: "delete",
  CHEVRON_LEFT: "chevron_left",
  CHEVRON_RIGHT: "chevron_right",
  DOWNLOAD: "download",
  CALENDAR: "calendar_today",
  CLOCK: "schedule",
  ALERT: "warning",
  CHECK: "check_circle",
  CLOSE: "close",
  SAVE: "save",
  CANCEL: "cancel",
  PERSON: "person",
  GROUP: "group",
  ASSIGNMENT: "assignment",
  TRANSCRIBE: "record_voice_over",
  PARKING: "playlist_add",
} as const;

// ダウンロード形式
export const DOWNLOAD_FORMATS = {
  EXCEL: "excel",
  AUDIO: "audio",
} as const;

// ダウンロード形式のラベル
export const DOWNLOAD_FORMAT_LABELS = {
  excel: "Excelファイル",
  audio: "音声ファイル",
} as const;

// Parking Lotの表示名（ユーザーフレンドリーな名称）
export const PARKING_LOT_LABEL = "保留事項" as const;

// 会議レポートの表示名
export const SUMMARY_PAGE_TITLE = "会議レポート" as const;
