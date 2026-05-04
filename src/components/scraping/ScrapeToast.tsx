"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Loader2, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrape } from "@/context/ScrapeContext";
import type { ScrapeProgress } from "@/types";

const AUTO_HIDE_MS = 5000;
const TERMINAL_STATUSES: ScrapeProgress["status"][] = ["done", "error", "binding-needed"];

function StatusIcon({ status }: { status: ScrapeProgress["status"] }) {
  if (status === "done") return <Check className="h-4 w-4 text-positive" />;
  if (status === "error") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (status === "binding-needed") return <Link2 className="h-4 w-4 text-warning" />;
  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
}

function statusLabel(status: ScrapeProgress["status"]): string {
  switch (status) {
    case "done": return "Done";
    case "error": return "Error";
    case "binding-needed": return "Needs binding";
    case "scraping": return "Scraping";
    case "importing": return "Importing";
    default: return "Pending";
  }
}

export function ScrapeToast() {
  const { isScraping, scrapeProgress, scrapeError, clearProgress } = useScrape();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isScraping) setDismissed(false);
  }, [isScraping]);

  useEffect(() => {
    if (scrapeError) setDismissed(false);
  }, [scrapeError]);

  const allTerminal =
    !isScraping &&
    scrapeProgress.length > 0 &&
    scrapeProgress.every((row) => TERMINAL_STATUSES.includes(row.status));

  const allDone = allTerminal && scrapeProgress.every((row) => row.status === "done");

  useEffect(() => {
    if (!allTerminal || dismissed) return;
    const timer = setTimeout(() => {
      clearProgress();
      setDismissed(true);
    }, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [allTerminal, dismissed, clearProgress]);

  if (dismissed) return null;
  if (!isScraping && scrapeProgress.length === 0 && !scrapeError) return null;

  const total = scrapeProgress.length;
  const headerText = scrapeError
    ? "Sync error"
    : isScraping
    ? total > 0
      ? `Syncing ${total} account${total === 1 ? "" : "s"}...`
      : "Resuming sync..."
    : allDone
    ? "Sync complete"
    : "Sync finished";

  function handleDismiss() {
    clearProgress();
    setDismissed(true);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="app-surface-card pointer-events-auto fixed bottom-4 right-4 z-40 flex w-[min(92vw,22rem)] flex-col gap-3 p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {scrapeError ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : isScraping ? (
            <Loader2 className="h-4 w-4 animate-spin text-warning" />
          ) : allDone ? (
            <Check className="h-4 w-4 text-positive" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
          <p className="text-sm font-semibold text-foreground">{headerText}</p>
        </div>
        {(!isScraping || scrapeError) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
            aria-label="Dismiss sync status"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {scrapeError && (
        <p className="text-xs text-destructive">{scrapeError}</p>
      )}

      {scrapeProgress.length > 0 && (
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {scrapeProgress.map((row) => (
            <li
              key={row.runId ?? `${row.accountId}-${row.accountName}`}
              className="flex items-center justify-between gap-3 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.accountName}
                </p>
                {row.message && (
                  <p className="truncate text-xs text-muted-foreground">
                    {row.message}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusIcon status={row.status} />
                <span className="text-xs text-muted-foreground">
                  {statusLabel(row.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
