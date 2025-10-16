/**
 * 会議管理用カスタムフック
 * 
 * 会議の一覧取得、作成、更新、削除を管理
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Meeting, MeetingCreate } from "@/lib/types";

type UseMeetingsReturn = {
  meetings: Meeting[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createMeeting: (data: MeetingCreate) => Promise<Meeting>;
  updateMeeting: (id: string, data: Partial<MeetingCreate>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
};

/**
 * 会議一覧を取得するカスタムフック
 * 
 * @returns 会議一覧、ローディング状態、エラー、再取得関数、CRUD操作関数
 */
export const useMeetings = (): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getMeetings();
      setMeetings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch meetings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMeeting = useCallback(async (data: MeetingCreate): Promise<Meeting> => {
    try {
      const newMeeting = await apiClient.createMeeting(data);
      setMeetings(prev => [newMeeting, ...prev]);
      return newMeeting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to create meeting:", err);
      throw err;
    }
  }, []);

  const updateMeeting = useCallback(async (id: string, data: Partial<MeetingCreate>): Promise<Meeting> => {
    try {
      const updatedMeeting = await apiClient.updateMeeting(id, data);
      setMeetings(prev => prev.map(meeting => 
        meeting.id === id ? updatedMeeting : meeting
      ));
      return updatedMeeting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to update meeting:", err);
      throw err;
    }
  }, []);

  const deleteMeeting = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.deleteMeeting(id);
      setMeetings(prev => prev.filter(meeting => meeting.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to delete meeting:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    isLoading,
    error,
    refetch: fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
};
