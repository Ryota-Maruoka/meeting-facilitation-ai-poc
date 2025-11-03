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
  MeetingDetailPreview,
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
      created_at: String(backend.createdAt ?? backend.created_at),
      updated_at: String(backend.updatedAt ?? backend.updated_at ?? backend.createdAt ?? backend.created_at),
      started_at: backend.startedAt ? String(backend.startedAt) : backend.started_at ? String(backend.started_at) : undefined,
      ended_at: backend.endedAt ? String(backend.endedAt) : backend.ended_at ? String(backend.ended_at) : undefined,
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

      // レスポンスボディが空の場合（204 No Content等）はJSONパースをスキップ
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");

      if (
        response.status === 204 ||
        contentLength === "0" ||
        (!contentType?.includes("application/json"))
      ) {
        return undefined as T;
      }

      // レスポンステキストを確認してから判断
      const text = await response.text();
      if (!text || text.trim() === "") {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // 会議管理
  async getMeetings(): Promise<Meeting[]> {
    const data = await this.request<Record<string, unknown>[]>(`/meetings`);
    return (data ?? []).map(this.mapBackendMeetingToFrontend.bind(this));
  }

  async getMeeting(id: string): Promise<Meeting> {
    const data = await this.request<Record<string, unknown>>(`/meetings/${id}`);
    return this.mapBackendMeetingToFrontend(data);
  }

  async createMeeting(data: MeetingCreate): Promise<Meeting> {
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
    payload.id = data.id;
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
    const payload = this.mapFrontendUpdateToBackend(data);
    const updated = await this.request<Record<string, unknown>>(`/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.mapBackendMeetingToFrontend(updated);
  }

  async deleteMeeting(id: string): Promise<void> {
    await this.request<void>(`/meetings/${id}`, {
      method: "DELETE",
    });
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
    formData.append("file", audioFile, audioFile.name);

    return this.request<Transcript>(`/meetings/${meetingId}/transcribe`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * 会議の録音ファイルをダウンロードする
   * 
   * @param meetingId - 会議ID
   * @param format - 出力形式（"mp3", "wav", "webm"、デフォルト: "wav"）
   * @param filename - ダウンロード時のファイル名（省略可）
   */
  async downloadAudio(meetingId: string, format: string = "wav", filename?: string): Promise<void> {
    const url = `${this.baseUrl}/meetings/${meetingId}/audio/download?format=${format}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("録音ファイルが見つかりません");
        }
        throw new Error(`ダウンロードに失敗しました: ${response.statusText}`);
      }

      // レスポンスからBlobを取得
      const blob = await response.blob();
      
      // ファイル名を決定（Content-Dispositionヘッダーから取得、またはデフォルト）
      let downloadFilename = filename;
      if (!downloadFilename) {
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          // RFC 5987形式（filename*=UTF-8''...）を優先的に取得
          const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
          if (encodedMatch) {
            // URLデコード
            downloadFilename = decodeURIComponent(encodedMatch[1]);
          } else {
            // 通常のfilename属性を取得
            const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
            if (filenameMatch) {
              downloadFilename = filenameMatch[1].trim();
            }
          }
        }
      }
      if (!downloadFilename) {
        downloadFilename = `recording_${meetingId}.${format}`;
      }

      // ダウンロードリンクを作成してクリック
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download audio:", error);
      throw error;
    }
  }

  async checkDeviation(meetingId: string): Promise<DeviationAlert> {
    const backendResponse = await this.request<Record<string, unknown>>(`/meetings/${meetingId}/deviation/check`, {
      method: "POST",
    });
    
    // バックエンドレスポンスをフロントエンド型にマッピング
    const timestamp = String(backendResponse.timestamp ?? new Date().toISOString());
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
      created_at: timestamp,
      timestamp: timestamp,
    };
  }

  // 保留事項（Parking Lot）関連
  async addParkingItem(meetingId: string, content: string, addToNextAgenda: boolean = false): Promise<void> {
    await this.request(`/meetings/${meetingId}/parking`, {
      method: "POST",
      body: JSON.stringify({
        title: "", // タイトルは空（バックエンドで自動生成）
        content,
        addToNextAgenda,
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

  // プレビューパネル用の会議詳細取得(要約・決定事項・アクション)
  async getMeetingDetailPreview(meetingId: string): Promise<MeetingDetailPreview> {
    return this.request<MeetingDetailPreview>(`/meetings/${meetingId}/summary`, {
      method: "GET",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
