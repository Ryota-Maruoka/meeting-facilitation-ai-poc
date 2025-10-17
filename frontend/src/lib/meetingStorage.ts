/**
 * 会議データの永続化ユーティリティ
 * JSONファイルを使ってデータを保存・取得
 */

export type MeetingStatus = "完了" | "下書き";

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  participants: string[];
  status: MeetingStatus;
  purpose: string;
  expectedOutcome: string;
  agendaItems: Array<{
    title: string;
    duration: number;
    expectedOutcome: string;
  }>;
  startTime?: string; // HH:MM
  duration?: string; // "XX分"
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// JSONファイルのパス（プロジェクトルートからの相対パス）
const MEETINGS_FILE_PATH = "/data/meetings/meetings.json";

/**
 * すべての会議データを取得
 */
export async function getAllMeetings(): Promise<Meeting[]> {
  try {
    const response = await fetch(MEETINGS_FILE_PATH);
    if (!response.ok) {
      console.error("Failed to fetch meetings:", response.statusText);
      return [];
    }
    const meetings: Meeting[] = await response.json();
    return meetings;
  } catch (error) {
    console.error("Error reading meetings:", error);
    return [];
  }
}

/**
 * 特定の会議データを取得
 */
export async function getMeetingById(id: string): Promise<Meeting | null> {
  const meetings = await getAllMeetings();
  return meetings.find((m) => m.id === id) || null;
}

/**
 * 会議データを保存（新規作成または更新）
 */
export async function saveMeeting(meeting: Meeting): Promise<boolean> {
  try {
    const meetings = await getAllMeetings();
    const existingIndex = meetings.findIndex((m) => m.id === meeting.id);

    if (existingIndex >= 0) {
      // 更新
      meetings[existingIndex] = {
        ...meeting,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 新規作成
      meetings.push({
        ...meeting,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // JSONファイルに書き込み（フロントエンドからは直接書き込めないため、APIエンドポイントを使用）
    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meetings),
    });

    return response.ok;
  } catch (error) {
    console.error("Error saving meeting:", error);
    return false;
  }
}

/**
 * 会議データを削除
 */
export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    const meetings = await getAllMeetings();
    const filteredMeetings = meetings.filter((m) => m.id !== id);

    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredMeetings),
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return false;
  }
}

/**
 * 新しい会議IDを生成
 */
export function generateMeetingId(): string {
  return `meeting-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
