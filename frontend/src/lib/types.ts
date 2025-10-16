/**
 * 共通型定義
 * 
 * 会議ファシリテーションアプリで使用するすべての型定義を集約
 */

// 会議の基本情報
export type Meeting = {
  id: string;
  title: string;
  purpose: string;
  expectedOutcome: string;
  participants: string[];
  recordingConsent: boolean;
  status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
  agenda: AgendaItem[];
};

// アジェンダ項目
export type AgendaItem = {
  id: string;
  title: string;
  duration: number; // 分
  expectedOutcome: string;
  relatedUrl?: string;
  status: "pending" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
};

// 文字起こしデータ
export type Transcript = {
  id: string;
  text: string;
  timestamp: string;
  speaker?: string;
  confidence?: number;
};

// ミニ要約
export type MiniSummary = {
  id: string;
  content: string;
  decisions: Decision[];
  unresolved: UnresolvedItem[];
  actions: Action[];
  generated_at: string;
};

// 決定事項
export type Decision = {
  id: string;
  content: string;
  reason: string;
  decided_by: string;
  decided_at: string;
};

// 未決事項
export type UnresolvedItem = {
  id: string;
  topic: string;
  missingInfo: string[];
  nextSteps: string[];
  priority: "high" | "medium" | "low";
};

// アクション項目
export type Action = {
  id: string;
  content: string;
  assignee: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
};

// Parking Lot項目
export type ParkingLotItem = {
  id: string;
  title: string;
  content: string;
  addToNextAgenda: boolean;
  created_at: string;
};

// 脱線検知アラート
export type DeviationAlert = {
  id?: string;
  is_deviation: boolean;
  confidence: number;
  similarity_score: number;
  best_agenda: string;
  message: string;
  suggested_agenda: string[];
  recent_text: string;
  timestamp: string;
};

// 会議後サマリ
export type MeetingSummary = {
  id: string;
  meetingId: string;
  content: string; // Markdown形式
  decisions: Decision[];
  unresolved: UnresolvedItem[];
  actions: Action[];
  parkingLot: ParkingLotItem[];
  generated_at: string;
};

// API レスポンス
export type ApiResponse<T> = {
  data: T;
  error: string | null;
};

// 会議作成用のデータ
export type MeetingCreate = Omit<Meeting, "id" | "created_at" | "updated_at" | "status">;

// アジェンダ作成用のデータ
export type AgendaItemCreate = Omit<AgendaItem, "id" | "status">;

// 決定作成用のデータ
export type DecisionCreate = Omit<Decision, "id" | "decided_at">;

// アクション作成用のデータ
export type ActionCreate = Omit<Action, "id" | "created_at" | "status">;

// Parking Lot作成用のデータ
export type ParkingLotItemCreate = Omit<ParkingLotItem, "id" | "created_at">;
