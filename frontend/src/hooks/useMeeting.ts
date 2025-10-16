/**
 * 単一会議管理用カスタムフック
 * 
 * 特定の会議の詳細情報と関連データを管理
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  Meeting,
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
} from "@/lib/types";

type UseMeetingReturn = {
  meeting: Meeting | null;
  agendaItems: AgendaItem[];
  transcripts: Transcript[];
  miniSummary: MiniSummary | null;
  decisions: Decision[];
  actions: Action[];
  parkingLot: ParkingLotItem[];
  deviationAlert: DeviationAlert | null;
  summary: MeetingSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // アジェンダ操作
  createAgendaItem: (data: AgendaItemCreate) => Promise<AgendaItem>;
  updateAgendaItem: (itemId: string, data: Partial<AgendaItemCreate>) => Promise<AgendaItem>;
  deleteAgendaItem: (itemId: string) => Promise<void>;
  // 文字起こし操作
  addTranscript: (data: Omit<Transcript, "id">) => Promise<Transcript>;
  // 要約・分析操作
  generateMiniSummary: () => Promise<MiniSummary>;
  extractUnresolved: () => Promise<void>;
  generateProposals: () => Promise<string[]>;
  checkDeviation: () => Promise<DeviationAlert>;
  // 決定・アクション操作
  createDecision: (data: DecisionCreate) => Promise<Decision>;
  createAction: (data: ActionCreate) => Promise<Action>;
  // Parking Lot操作
  createParkingLotItem: (data: ParkingLotItemCreate) => Promise<ParkingLotItem>;
  // サマリ操作
  generateFinalSummary: () => Promise<MeetingSummary>;
  sendToSlack: (webhookUrl: string) => Promise<void>;
};

/**
 * 単一会議の詳細情報を取得するカスタムフック
 * 
 * @param meetingId 会議ID
 * @returns 会議詳細情報、関連データ、ローディング状態、エラー、操作関数
 */
export const useMeeting = (meetingId: string): UseMeetingReturn => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [miniSummary, setMiniSummary] = useState<MiniSummary | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [parkingLot, setParkingLot] = useState<ParkingLotItem[]>([]);
  const [deviationAlert, setDeviationAlert] = useState<DeviationAlert | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingData = useCallback(async () => {
    if (!meetingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        meetingData,
        agendaData,
        transcriptsData,
        decisionsData,
        actionsData,
        parkingLotData,
      ] = await Promise.all([
        apiClient.getMeeting(meetingId),
        apiClient.getAgendaItems(meetingId),
        apiClient.getTranscripts(meetingId),
        apiClient.getDecisions(meetingId),
        apiClient.getActions(meetingId),
        apiClient.getParkingLot(meetingId),
      ]);

      setMeeting(meetingData);
      setAgendaItems(agendaData);
      setTranscripts(transcriptsData);
      setDecisions(decisionsData);
      setActions(actionsData);
      setParkingLot(parkingLotData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch meeting data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  // アジェンダ操作
  const createAgendaItem = useCallback(async (data: AgendaItemCreate): Promise<AgendaItem> => {
    try {
      const newItem = await apiClient.createAgendaItem(meetingId, data);
      setAgendaItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create agenda item:", err);
      throw err;
    }
  }, [meetingId]);

  const updateAgendaItem = useCallback(async (itemId: string, data: Partial<AgendaItemCreate>): Promise<AgendaItem> => {
    try {
      const updatedItem = await apiClient.updateAgendaItem(meetingId, itemId, data);
      setAgendaItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      return updatedItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to update agenda item:", err);
      throw err;
    }
  }, [meetingId]);

  const deleteAgendaItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      await apiClient.deleteAgendaItem(meetingId, itemId);
      setAgendaItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to delete agenda item:", err);
      throw err;
    }
  }, [meetingId]);

  // 文字起こし操作
  const addTranscript = useCallback(async (data: Omit<Transcript, "id">): Promise<Transcript> => {
    try {
      const newTranscript = await apiClient.addTranscript(meetingId, data);
      setTranscripts(prev => [...prev, newTranscript]);
      return newTranscript;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to add transcript:", err);
      throw err;
    }
  }, [meetingId]);

  // 要約・分析操作
  const generateMiniSummary = useCallback(async (): Promise<MiniSummary> => {
    try {
      const summary = await apiClient.generateMiniSummary(meetingId);
      setMiniSummary(summary);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to generate mini summary:", err);
      throw err;
    }
  }, [meetingId]);

  const extractUnresolved = useCallback(async (): Promise<void> => {
    try {
      await apiClient.extractUnresolved(meetingId);
      // 未決事項の抽出結果は要約に含まれるため、要約を再取得
      await generateMiniSummary();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to extract unresolved items:", err);
      throw err;
    }
  }, [meetingId, generateMiniSummary]);

  const generateProposals = useCallback(async (): Promise<string[]> => {
    try {
      return await apiClient.generateProposals(meetingId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to generate proposals:", err);
      throw err;
    }
  }, [meetingId]);

  const checkDeviation = useCallback(async (): Promise<DeviationAlert> => {
    try {
      const alert = await apiClient.checkDeviation(meetingId);
      setDeviationAlert(alert);
      return alert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to check deviation:", err);
      throw err;
    }
  }, [meetingId]);

  // 決定・アクション操作
  const createDecision = useCallback(async (data: DecisionCreate): Promise<Decision> => {
    try {
      const newDecision = await apiClient.createDecision(meetingId, data);
      setDecisions(prev => [...prev, newDecision]);
      return newDecision;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create decision:", err);
      throw err;
    }
  }, [meetingId]);

  const createAction = useCallback(async (data: ActionCreate): Promise<Action> => {
    try {
      const newAction = await apiClient.createAction(meetingId, data);
      setActions(prev => [...prev, newAction]);
      return newAction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create action:", err);
      throw err;
    }
  }, [meetingId]);

  // Parking Lot操作
  const createParkingLotItem = useCallback(async (data: ParkingLotItemCreate): Promise<ParkingLotItem> => {
    try {
      const newItem = await apiClient.createParkingLotItem(meetingId, data);
      setParkingLot(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create parking lot item:", err);
      throw err;
    }
  }, [meetingId]);

  // サマリ操作
  const generateFinalSummary = useCallback(async (): Promise<MeetingSummary> => {
    try {
      const summary = await apiClient.generateFinalSummary(meetingId);
      setSummary(summary);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to generate final summary:", err);
      throw err;
    }
  }, [meetingId]);

  const sendToSlack = useCallback(async (webhookUrl: string): Promise<void> => {
    try {
      await apiClient.sendToSlack(meetingId, webhookUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to send to Slack:", err);
      throw err;
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeetingData();
  }, [fetchMeetingData]);

  return {
    meeting,
    agendaItems,
    transcripts,
    miniSummary,
    decisions,
    actions,
    parkingLot,
    deviationAlert,
    summary,
    isLoading,
    error,
    refetch: fetchMeetingData,
    createAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    addTranscript,
    generateMiniSummary,
    extractUnresolved,
    generateProposals,
    checkDeviation,
    createDecision,
    createAction,
    createParkingLotItem,
    generateFinalSummary,
    sendToSlack,
  };
};
