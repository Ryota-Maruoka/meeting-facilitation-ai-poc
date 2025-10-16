/**
 * 定数定義
 * 
 * アプリケーション全体で使用する定数を集約
 */

// API設定
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
