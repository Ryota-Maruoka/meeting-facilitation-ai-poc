/**
 * API クライアント
 *
 * バックエンドAPIとの通信を担当するクライアント
 */

import { API_BASE_URL, ERROR_MESSAGES } from "./constants";
import type {
  Meeting,
  MeetingCreate,
  MeetingCreateWithId,
  AgendaItem,
  AgendaItemCreate,
  Transcript,
  MiniSummary,
  Decision,
  DecisionCreate,
  Action,
  ActionCreate,
  ParkingLotItem,
  ParkingLotItemCreate,
  DeviationAlert,
  MeetingSummary,
  ApiResponse,
  UnresolvedItem,
} from "./types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // ---------- Backend <-> Frontend 型マッピング（会議） ----------
  private mapBackendMeetingToFrontend(backend: Record<string, unknown>): Meeting {
    return {
      id: String(backend.id),
      title: String(backend.title),
      purpose: String(backend.purpose),
      expectedOutcome: String(backend.deliverable_template ?? ""),
      meetingDate: backend.meetingDate ? String(backend.meetingDate) : undefined,
      participants: Array.isArray(backend.participants) ? backend.participants as string[] : [],
      status: (backend.status as "draft" | "active" | "completed") ?? "draft",
      created_at: String(backend.created_at),
      updated_at: String(backend.updated_at ?? backend.created_at),
      started_at: backend.started_at ? String(backend.started_at) : undefined,
      ended_at: backend.ended_at ? String(backend.ended_at) : undefined,
      agenda: Array.isArray(backend.agenda) ? (backend.agenda as Record<string, unknown>[]).map((item) => ({
        id: String(item.id ?? ""),
        title: String(item.title),
        duration: Number(item.duration ?? item.duration_min ?? 10),
        expectedOutcome: String(item.expectedOutcome ?? item.expected_outcome ?? ""),
        relatedUrl: item.relatedUrl ? String(item.relatedUrl) : undefined,
        status: "pending" as const,
      })) : [],
    };
  }

  private mapFrontendCreateToBackend(payload: MeetingCreate): Record<string, unknown> {
    return {
      title: payload.title,
      purpose: payload.purpose,
      deliverable_template: payload.expectedOutcome,
      meetingDate: payload.meetingDate,
      participants: payload.participants ?? [],
      agenda: (payload.agenda ?? []).map((item: any) => {
        const agendaItem: Record<string, unknown> = {
          title: item.title,
          duration: item.duration,
          expectedOutcome: item.expectedOutcome || "",
        };
        // relatedUrlがnullまたは空文字列でない場合のみ追加
        if (item.relatedUrl) {
          agendaItem.relatedUrl = item.relatedUrl;
        }
        return agendaItem;
      }),
    };
  }

  /**
   * 汎用HTTPリクエストメソッド
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // FormDataの場合はContent-Typeを自動設定に任せる
    const isFormData = options?.body instanceof FormData;
    const headers = isFormData 
      ? { ...options?.headers }
      : {
          "Content-Type": "application/json",
          ...options?.headers,
        };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // 会議管理
  async getMeetings(): Promise<Meeting[]> {
    // 実APIから取得
    const data = await this.request<Record<string, unknown>[]>(`/meetings`);
    return (data ?? []).map(this.mapBackendMeetingToFrontend.bind(this));
  }

  async getMeeting(id: string): Promise<Meeting> {
    // 実APIから取得
    const data = await this.request<Record<string, unknown>>(`/meetings/${id}`);
    return this.mapBackendMeetingToFrontend(data);
  }

  async createMeeting(data: MeetingCreate): Promise<Meeting> {
    // 実APIへ作成リクエスト
    const payload = this.mapFrontendCreateToBackend(data);
    const created = await this.request<Record<string, unknown>>(`/meetings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const meeting = this.mapBackendMeetingToFrontend(created);
    return meeting;
  }

  async createMeetingWithId(data: MeetingCreateWithId): Promise<Meeting> {
    // IDを指定して会議を作成
    const payload = this.mapFrontendCreateToBackend(data);
    payload.id = data.id; // IDを追加
    const created = await this.request<Record<string, unknown>>(`/meetings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const meeting = this.mapBackendMeetingToFrontend(created);
    return meeting;
  }

  private mapFrontendUpdateToBackend(data: Partial<Meeting> & { summary?: unknown }): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (data.title !== undefined) payload.title = data.title;
    if (data.purpose !== undefined) payload.purpose = data.purpose;
    if (data.expectedOutcome !== undefined) payload.deliverable_template = data.expectedOutcome;
    if (data.meetingDate !== undefined) payload.meetingDate = data.meetingDate;
    if (data.participants !== undefined) payload.participants = data.participants;
    if (data.agenda !== undefined) {
      payload.agenda = data.agenda.map((item) => ({
        title: item.title,
        duration: item.duration,
        expectedOutcome: item.expectedOutcome,
        relatedUrl: item.relatedUrl,
      }));
    }
    if (data.status !== undefined) payload.status = data.status;
    if (data.started_at !== undefined) payload.started_at = data.started_at;
    if (data.ended_at !== undefined) payload.ended_at = data.ended_at;
    if (data.summary !== undefined) payload.summary = data.summary;

    return payload;
  }

  async updateMeeting(id: string, data: Partial<Meeting> & { summary?: unknown }): Promise<Meeting> {
    // 実APIへ更新リクエスト
    const payload = this.mapFrontendUpdateToBackend(data);
    const updated = await this.request<Record<string, unknown>>(`/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.mapBackendMeetingToFrontend(updated);
  }

  async deleteMeeting(id: string): Promise<void> {
    // 実APIにDELETEがないため、現状はno-op。実装後に差し替え。
    return Promise.resolve();
  }

  // アジェンダ管理
  async getAgendaItems(meetingId: string): Promise<AgendaItem[]> {
    return this.request<AgendaItem[]>(`/meetings/${meetingId}/agenda`);
  }

  async createAgendaItem(meetingId: string, data: AgendaItemCreate): Promise<AgendaItem> {
    return this.request<AgendaItem>(`/meetings/${meetingId}/agenda`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAgendaItem(meetingId: string, itemId: string, data: Partial<AgendaItemCreate>): Promise<AgendaItem> {
    return this.request<AgendaItem>(`/meetings/${meetingId}/agenda/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAgendaItem(meetingId: string, itemId: string): Promise<void> {
    return this.request<void>(`/meetings/${meetingId}/agenda/${itemId}`, {
      method: "DELETE",
    });
  }

  // 文字起こし
  async getTranscripts(meetingId: string): Promise<Transcript[]> {
    return this.request<Transcript[]>(`/meetings/${meetingId}/transcripts`);
  }

  async addTranscript(meetingId: string, data: Omit<Transcript, "id">): Promise<Transcript> {
    return this.request<Transcript>(`/meetings/${meetingId}/transcripts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async transcribeAudio(meetingId: string, audioFile: File): Promise<Transcript> {
    const formData = new FormData();
    // ファイル名を明示的に設定（ブラウザの互換性のため）
    formData.append("file", audioFile, audioFile.name);

    return this.request<Transcript>(`/meetings/${meetingId}/transcribe`, {
      method: "POST",
      body: formData,
    });
  }

  async checkDeviation(meetingId: string): Promise<DeviationAlert> {
    const backendResponse = await this.request<Record<string, unknown>>(`/meetings/${meetingId}/deviation/check`, {
      method: "POST",
    });
    
    // バックエンドレスポンスをフロントエンド型にマッピング
    return {
      id: String(backendResponse.id ?? Date.now().toString()),
      is_deviation: Boolean(backendResponse.is_deviation),
      confidence: Number(backendResponse.confidence ?? 0),
      similarity: Number(backendResponse.similarity_score ?? 0),
      best_agenda: String(backendResponse.best_agenda ?? ""),
      message: String(backendResponse.message ?? ""),
      suggestedTopics: Array.isArray(backendResponse.suggested_agenda) 
        ? backendResponse.suggested_agenda as string[]
        : [],
      recent_text: String(backendResponse.recent_text ?? ""),
      created_at: String(backendResponse.timestamp ?? new Date().toISOString()),
    };
  }

  // 保留事項（Parking Lot）関連
  async addParkingItem(meetingId: string, title: string): Promise<void> {
    await this.request(`/meetings/${meetingId}/parking`, {
      method: "POST",
      body: JSON.stringify({
        title,
      }),
    });
  }

  async getParkingItems(meetingId: string): Promise<Array<{ title: string }>> {
    return this.request(`/meetings/${meetingId}/parking`, {
      method: "GET",
    });
  }

  // 要約・分析
  async generateMiniSummary(meetingId: string): Promise<MiniSummary> {
    return this.request<MiniSummary>(`/meetings/${meetingId}/summary/mini`, {
      method: "POST",
    });
  }

  async extractUnresolved(meetingId: string): Promise<UnresolvedItem[]> {
    return this.request<UnresolvedItem[]>(`/meetings/${meetingId}/unresolved/extract`, {
      method: "POST",
    });
  }

  async generateProposals(meetingId: string): Promise<string[]> {
    return this.request<string[]>(`/meetings/${meetingId}/proposals/generate`, {
      method: "POST",
    });
  }

  // 決定・アクション
  async getDecisions(meetingId: string): Promise<Decision[]> {
    return this.request<Decision[]>(`/meetings/${meetingId}/decisions`);
  }

  async createDecision(meetingId: string, data: DecisionCreate): Promise<Decision> {
    return this.request<Decision>(`/meetings/${meetingId}/decisions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getActions(meetingId: string): Promise<Action[]> {
    return this.request<Action[]>(`/meetings/${meetingId}/actions`);
  }

  async createAction(meetingId: string, data: ActionCreate): Promise<Action> {
    return this.request<Action>(`/meetings/${meetingId}/actions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Parking Lot
  async getParkingLot(meetingId: string): Promise<ParkingLotItem[]> {
    return this.request<ParkingLotItem[]>(`/meetings/${meetingId}/parking`);
  }

  async createParkingLotItem(meetingId: string, data: ParkingLotItemCreate): Promise<ParkingLotItem> {
    return this.request<ParkingLotItem>(`/meetings/${meetingId}/parking`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // サマリ・連携
  async generateFinalSummary(meetingId: string): Promise<MeetingSummary> {
    return this.request<MeetingSummary>(`/meetings/${meetingId}/summary/final`, {
      method: "POST",
    });
  }

  async sendToSlack(meetingId: string, webhookUrl: string): Promise<void> {
    return this.request<void>("/slack/send", {
      method: "POST",
      body: JSON.stringify({ meetingId, webhookUrl }),
    });
  }

  // 会議開始・終了
  async startMeeting(meetingId: string): Promise<Meeting> {
    const data = await this.request<Record<string, unknown>>(`/meetings/${meetingId}/start`, {
      method: "POST",
    });
    return this.mapBackendMeetingToFrontend(data);
  }

  async endMeeting(meetingId: string): Promise<Meeting> {
    const data = await this.request<Record<string, unknown>>(`/meetings/${meetingId}/end`, {
      method: "POST",
    });
    return this.mapBackendMeetingToFrontend(data);
  }

  // 要約取得・生成
  async getSummary(meetingId: string): Promise<any> {
    return this.request<any>(`/meetings/${meetingId}/summary`, {
      method: "GET",
    });
  }

  async generateSummary(meetingId: string): Promise<any> {
    return this.request<any>(`/meetings/${meetingId}/summary/generate`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
