"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScrapeRunDTO, ScrapeRunDetailDTO } from "@/types";

interface SyncHistoryState {
  runs: ScrapeRunDTO[];
  isLoading: boolean;
  error: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

export function useSyncHistoryViewModel() {
  const [state, setState] = useState<SyncHistoryState>({
    runs: [],
    isLoading: true,
    error: null,
  });
  const [selectedRun, setSelectedRun] = useState<ScrapeRunDetailDTO | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchRuns = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/scrape/history");
      const data = await readJson<{ runs: ScrapeRunDTO[] }>(response);
      setState({ runs: data.runs, isLoading: false, error: null });
    } catch (error) {
      setState({
        runs: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load history",
      });
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const openRun = useCallback(async (runId: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/scrape/history/${runId}`);
      const detail = await readJson<ScrapeRunDetailDTO>(response);
      setSelectedRun(detail);
    } catch (error) {
      console.error("[SyncHistory] Failed to load run detail", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeRun = useCallback(() => setSelectedRun(null), []);

  return {
    runs: state.runs,
    isLoading: state.isLoading,
    error: state.error,
    selectedRun,
    isLoadingDetail,
    refresh: fetchRuns,
    openRun,
    closeRun,
  };
}
