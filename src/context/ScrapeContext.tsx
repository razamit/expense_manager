"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ScrapeProgress } from "@/types";

export type ScrapeScope = { kind: "all" } | { kind: "account"; accountId: string } | null;

interface ScrapeState {
  isScraping: boolean;
  scrapeProgress: ScrapeProgress[];
  pendingBinding: ScrapeProgress | null;
  scrapeError: string | null;
}

interface ScrapeContextValue extends ScrapeState {
  scrapeAccount: (accountId: string) => Promise<void>;
  scrapeAllAccounts: () => Promise<void>;
  bindAccountNumber: (accountId: string, accountNumber: string) => Promise<void>;
  clearPendingBinding: () => void;
  clearProgress: () => void;
}

const ScrapeContext = createContext<ScrapeContextValue | null>(null);

export const ACCOUNTS_REFRESH_EVENT_NAME = "accounts-refresh";
const POLL_INTERVAL_MS = 1500;
// Two empty-active ticks before stopping poll — guards against transient gaps.
const STOP_POLL_AFTER_EMPTY_TICKS = 2;

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

function dispatchAccountsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACCOUNTS_REFRESH_EVENT_NAME));
  }
}

function getFirstBindingResult(rows: ScrapeProgress[]) {
  return rows.find((r) => r.status === "binding-needed") ?? null;
}

export function ScrapeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrapeState>({
    isScraping: false,
    scrapeProgress: [],
    pendingBinding: null,
    scrapeError: null,
  });

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emptyActiveTicksRef = useRef(0);
  const prevActiveCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    emptyActiveTicksRef.current = 0;
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const response = await fetch("/api/scrape/runs");
      if (response.status === 401) return;
      const data = await readJson<{ active: ScrapeProgress[]; recent: ScrapeProgress[] }>(response);
      const { active, recent } = data;

      const hadActive = prevActiveCountRef.current > 0;
      const nowEmpty = active.length === 0;

      if (nowEmpty) {
        emptyActiveTicksRef.current += 1;
      } else {
        emptyActiveTicksRef.current = 0;
      }

      prevActiveCountRef.current = active.length;

      // Dispatch accounts refresh whenever a run flips to terminal.
      if (hadActive && nowEmpty) {
        dispatchAccountsRefresh();
      }

      const allRows = [...active, ...recent];

      setState((prev) => ({
        ...prev,
        isScraping: active.length > 0,
        scrapeProgress: allRows,
        pendingBinding: getFirstBindingResult(allRows) ?? prev.pendingBinding,
      }));

      if (nowEmpty && emptyActiveTicksRef.current >= STOP_POLL_AFTER_EMPTY_TICKS) {
        stopPolling();
      }
    } catch {
      // Network error — keep polling; don't clear progress.
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current !== null) return;
    emptyActiveTicksRef.current = 0;
    pollTimerRef.current = setInterval(fetchRuns, POLL_INTERVAL_MS);
  }, [fetchRuns]);

  // On mount: check for in-progress runs (reload recovery, new tab).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("/api/scrape/runs");
        if (!response.ok || !mounted) return;
        const data = await readJson<{ active: ScrapeProgress[]; recent: ScrapeProgress[] }>(response);
        if (data.active.length > 0) {
          prevActiveCountRef.current = data.active.length;
          setState((prev) => ({
            ...prev,
            isScraping: true,
            scrapeProgress: [...data.active, ...data.recent],
            pendingBinding: getFirstBindingResult([...data.active, ...data.recent]) ?? prev.pendingBinding,
          }));
          startPolling();
        } else if (data.recent.length > 0) {
          setState((prev) => ({
            ...prev,
            scrapeProgress: data.recent,
          }));
        }
      } catch { /* ignore */ }
    })();
    return () => {
      mounted = false;
    };
  }, [startPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const triggerScrape = useCallback(
    async (body: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, scrapeError: null }));
      try {
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent("app-locked"));
          return;
        }
        if (response.status === 409) {
          const payload = await response.json().catch(() => ({}));
          setState((prev) => ({
            ...prev,
            scrapeError: payload?.error ?? "Scrape already in progress",
          }));
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to start scrape");
        }

        // Optimistically mark as scraping; polling will fill in rows.
        setState((prev) => ({ ...prev, isScraping: true, scrapeProgress: [] }));
        prevActiveCountRef.current = 1;
        startPolling();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          scrapeError: error instanceof Error ? error.message : "Scrape failed",
        }));
      }
    },
    [startPolling]
  );

  const scrapeAccount = useCallback(
    async (accountId: string) => {
      await triggerScrape({ accountId });
    },
    [triggerScrape]
  );

  const scrapeAllAccounts = useCallback(async () => {
    await triggerScrape({});
  }, [triggerScrape]);

  const bindAccountNumber = useCallback(
    async (accountId: string, accountNumber: string) => {
      setState((prev) => ({ ...prev, pendingBinding: null }));
      const response = await fetch("/api/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId, accountNumber }),
      });
      await readJson<unknown>(response);
      dispatchAccountsRefresh();
      await scrapeAccount(accountId);
    },
    [scrapeAccount]
  );

  const clearPendingBinding = useCallback(() => {
    setState((prev) => ({ ...prev, pendingBinding: null }));
  }, []);

  const clearProgress = useCallback(() => {
    setState((prev) => ({ ...prev, scrapeProgress: [], scrapeError: null }));
  }, []);

  const value = useMemo<ScrapeContextValue>(
    () => ({
      ...state,
      scrapeAccount,
      scrapeAllAccounts,
      bindAccountNumber,
      clearPendingBinding,
      clearProgress,
    }),
    [state, scrapeAccount, scrapeAllAccounts, bindAccountNumber, clearPendingBinding, clearProgress]
  );

  return <ScrapeContext.Provider value={value}>{children}</ScrapeContext.Provider>;
}

export function useScrape(): ScrapeContextValue {
  const ctx = useContext(ScrapeContext);
  if (!ctx) {
    throw new Error("useScrape must be used within ScrapeProvider");
  }
  return ctx;
}
