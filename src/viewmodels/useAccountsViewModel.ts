"use client";

import { useState, useEffect, useCallback } from "react";
import type { AccountDTO } from "@/types";
import {
  useScrape,
  ACCOUNTS_REFRESH_EVENT_NAME,
} from "@/context/ScrapeContext";

interface AccountsState {
  accounts: AccountDTO[];
  isLoading: boolean;
}

export interface SaveAccountInput {
  id?: string;
  displayName?: string;
  companyType?: string;
  accountNumber?: string | null;
  credentialSourceAccountId?: string | null;
  credentials?: Record<string, string>;
  isActive?: boolean;
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

export function useAccountsViewModel() {
  const [state, setState] = useState<AccountsState>({
    accounts: [],
    isLoading: true,
  });

  const scrape = useScrape();

  const fetchAccounts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/accounts");
      const accounts = await readJson<AccountDTO[]>(response);
      setState((prev) => ({ ...prev, accounts, isLoading: false }));
    } catch (error) {
      console.error("[Accounts] Failed to fetch accounts", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    function handleRefresh() {
      fetchAccounts();
    }
    window.addEventListener(ACCOUNTS_REFRESH_EVENT_NAME, handleRefresh);
    return () =>
      window.removeEventListener(ACCOUNTS_REFRESH_EVENT_NAME, handleRefresh);
  }, [fetchAccounts]);

  async function saveAccount(data: SaveAccountInput) {
    const method = data.id ? "PUT" : "POST";
    const response = await fetch("/api/accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    await readJson<AccountDTO>(response);
    await fetchAccounts();
  }

  async function addAccount(data: SaveAccountInput) {
    await saveAccount(data);
  }

  async function updateAccount(data: SaveAccountInput) {
    await saveAccount(data);
  }

  async function removeAccount(id: string) {
    const response = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    await readJson<{ success: boolean }>(response);
    await fetchAccounts();
  }

  return {
    accounts: state.accounts,
    isLoading: state.isLoading,
    isScraping: scrape.isScraping,
    scrapeProgress: scrape.scrapeProgress,
    pendingBinding: scrape.pendingBinding,
    saveAccount,
    addAccount,
    updateAccount,
    removeAccount,
    scrapeAccount: scrape.scrapeAccount,
    scrapeAllAccounts: scrape.scrapeAllAccounts,
    bindAccountNumber: scrape.bindAccountNumber,
    clearPendingBinding: scrape.clearPendingBinding,
    refresh: fetchAccounts,
  };
}
