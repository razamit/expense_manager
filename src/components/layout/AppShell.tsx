"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MasterPasswordDialog } from "@/components/shared/MasterPasswordDialog";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

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

  const handleScrapeClick = useCallback(async () => {
    setIsScraping(true);
    try {
      await fetch("/api/scrape", { method: "POST" });
    } finally {
      setIsScraping(false);
    }
  }, []);

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
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <MasterPasswordDialog
        open={isLocked}
        isFirstTime={isFirstTime}
        onSubmit={handlePasswordSubmit}
      />
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            onScrapeClick={handleScrapeClick}
            onLockClick={handleLockClick}
            isScraping={isScraping}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
