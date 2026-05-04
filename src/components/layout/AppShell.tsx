"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MasterPasswordDialog } from "@/components/shared/MasterPasswordDialog";
import { ScrapeProvider } from "@/context/ScrapeContext";
import { ScrapeToast } from "@/components/scraping/ScrapeToast";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    function handleAppLocked() {
      setIsLocked(true);
    }
    window.addEventListener("app-locked", handleAppLocked);
    return () => window.removeEventListener("app-locked", handleAppLocked);
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await fetch("/api/auth/unlock");
      const data = await response.json();
      setIsFirstTime(!data.isPasswordSet);
      setIsLocked(!data.isUnlocked);
    } catch {
      setIsFirstTime(true);
      setIsLocked(true);
    } finally {
      setIsCheckingAuth(false);
    }
  }

  async function handlePasswordSubmit(password: string): Promise<boolean> {
    const endpoint = "/api/auth/unlock";
    const body = isFirstTime
      ? { action: "create", password }
      : { action: "unlock", password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      setIsLocked(false);
      setIsFirstTime(false);
      return true;
    }
    return false;
  }

  function handleLockClick() {
    fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock" }),
    }).then(() => {
      setIsLocked(true);
    });
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-low px-6">
        <div className="app-surface-card flex min-w-[280px] flex-col items-center gap-3 p-6 text-center">
          <div className="h-2 w-16 rounded-full bg-surface-container-high" />
          <p className="app-eyebrow-label">FinanceChecker</p>
          <p className="text-sm text-muted-foreground">Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrapeProvider>
      <MasterPasswordDialog
        open={isLocked}
        isFirstTime={isFirstTime}
        onSubmit={handlePasswordSubmit}
      />
      <div className="min-h-screen bg-surface-container-low md:pl-72">
        <Sidebar />
        <div className="flex min-h-screen flex-col">
          <TopBar onLockClick={handleLockClick} />
          <main className="min-w-0 flex-1 bg-surface-container-low">
            {children}
          </main>
        </div>
      </div>
      <ScrapeToast />
    </ScrapeProvider>
  );
}
