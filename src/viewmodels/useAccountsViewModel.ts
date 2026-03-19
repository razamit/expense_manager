"use client";

import { useState, useEffect, useCallback } from "react";
import type { AccountDTO, ScrapeProgress } from "@/types";

interface AccountsState {
  accounts: AccountDTO[];
  isLoading: boolean;
  scrapeProgress: ScrapeProgress[];
  isScraping: boolean;
}

export function useAccountsViewModel() {
  const [state, setState] = useState<AccountsState>({
    accounts: [],
    isLoading: true,
    scrapeProgress: [],
    isScraping: false,
  });

  const fetchAccounts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const response = await fetch("/api/accounts");
    const accounts = await response.json();
    setState((prev) => ({ ...prev, accounts, isLoading: false }));
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function addAccount(data: {
    displayName: string;
    companyType: string;
    accountNumber: string;
    credentials: Record<string, string>;
  }) {
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchAccounts();
  }

  async function updateAccount(data: {
    id: string;
    displayName?: string;
    isActive?: boolean;
    credentials?: Record<string, string>;
  }) {
    await fetch("/api/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchAccounts();
  }

  async function removeAccount(id: string) {
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
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

      const result = await response.json();
      setState((prev) => ({
        ...prev,
        scrapeProgress: [result],
      }));
      fetchAccounts();
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

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        scrapeProgress: data.results ?? [],
      }));
      fetchAccounts();
    } finally {
      setState((prev) => ({ ...prev, isScraping: false }));
    }
  }

  return {
    ...state,
    addAccount,
    updateAccount,
    removeAccount,
    scrapeAccount,
    scrapeAllAccounts,
    refresh: fetchAccounts,
  };
}
