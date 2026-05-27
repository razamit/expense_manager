"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { describeStatus } from "./scrape-status";
import type { ScrapeRunDTO } from "@/types";

interface SyncRunRowProps {
  run: ScrapeRunDTO;
  onOpen: (runId: string) => void;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function SyncRunRow({ run, onOpen }: SyncRunRowProps) {
  const status = describeStatus(run.status);
  const isError = run.status === "error";

  return (
    <button
      type="button"
      onClick={() => onOpen(run.id)}
      className="flex w-full items-center gap-4 rounded-md border border-outline-variant bg-card px-4 py-3 text-left transition-colors hover:bg-sidebar-accent/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {run.accountName ?? run.accountId}
          </p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {formatDateTime(run.startedAt)}
          {isError && run.errorMessage ? ` — ${run.errorMessage}` : ""}
          {!isError ? ` — ${run.newTxnCount} new / ${run.txnCount} total` : ""}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
