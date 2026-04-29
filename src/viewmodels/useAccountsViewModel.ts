"use client";

import { useState, useEffect, useCallback } from "react";
import type { AccountDTO, ScrapeProgress } from "@/types";

interface AccountsState {
  accounts: AccountDTO[];
  isLoading: boolean;
  scrapeProgress: ScrapeProgress[];
  isScraping: boolean;
  pendingBinding: ScrapeProgress | null;
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

function getFirstBindingResult(results: ScrapeProgress[]) {
  return results.find((result) => result.status === "binding-needed") ?? null;
}

export function useAccountsViewModel() {
  const [state, setState] = useState<AccountsState>({
    accounts: [],
    isLoading: true,
    scrapeProgress: [],
    isScraping: false,
    pendingBinding: null,
  });

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

  async function scrapeAccount(accountId: string) {
    setState((prev) => ({ ...prev, isScraping: true }));
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("app-locked"));
        return;
      }

      const result = await readJson<ScrapeProgress>(response);
      setState((prev) => ({
        ...prev,
        scrapeProgress: [result],
        pendingBinding:
          result.status === "binding-needed" ? result : prev.pendingBinding,
      }));
      await fetchAccounts();
    } catch (error) {
      const account = state.accounts.find(
        (candidateAccount) => candidateAccount.id === accountId
      );
      setState((prev) => ({
        ...prev,
        scrapeProgress: [
          {
            accountId,
            accountName: account?.displayName ?? "Unknown account",
            status: "error",
            message:
              error instanceof Error ? error.message : "Scrape failed",
          },
        ],
      }));
    } finally {
      setState((prev) => ({ ...prev, isScraping: false }));
    }
  }

  async function scrapeAllAccounts() {
    setState((prev) => ({ ...prev, isScraping: true }));
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("app-locked"));
        return;
      }

      const data = await readJson<{ results?: ScrapeProgress[] }>(response);
      const results = data.results ?? [];
      setState((prev) => ({
        ...prev,
        scrapeProgress: results,
        pendingBinding: getFirstBindingResult(results) ?? prev.pendingBinding,
      }));
      await fetchAccounts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        scrapeProgress: [
          {
            accountId: "all",
            accountName: "All Accounts",
            status: "error",
            message:
              error instanceof Error ? error.message : "Scrape failed",
          },
        ],
      }));
    } finally {
      setState((prev) => ({ ...prev, isScraping: false }));
    }
  }

  async function bindAccountNumber(accountId: string, accountNumber: string) {
    setState((prev) => ({ ...prev, pendingBinding: null }));
    await updateAccount({ id: accountId, accountNumber });
    await scrapeAccount(accountId);
  }

  function clearPendingBinding() {
    setState((prev) => ({ ...prev, pendingBinding: null }));
  }

  return {
    ...state,
    saveAccount,
    addAccount,
    updateAccount,
    removeAccount,
    scrapeAccount,
    scrapeAllAccounts,
    bindAccountNumber,
    clearPendingBinding,
    refresh: fetchAccounts,
  };
}
