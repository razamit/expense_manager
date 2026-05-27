"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { describeStatus, LOG_LEVEL_CLASS } from "./scrape-status";
import type { ScrapeRunDetailDTO } from "@/types";

interface SyncRunLogDialogProps {
  run: ScrapeRunDetailDTO | null;
  isLoading: boolean;
  onClose: () => void;
}

function formatTime(ts: string): string {
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? ts : date.toLocaleTimeString();
}

export function SyncRunLogDialog({ run, isLoading, onClose }: SyncRunLogDialogProps) {
  const open = Boolean(run) || isLoading;
  const status = run ? describeStatus(run.status) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {run ? run.accountName : "Loading run..."}
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {run && (
          <div className="space-y-4">
            {run.errorMessage && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  {run.errorType ?? "Error"}
                </p>
                <p className="mt-1 text-sm text-foreground">{run.errorMessage}</p>
              </div>
            )}

            <ScrollArea className="h-[360px] rounded-md border border-outline-variant bg-muted/30 p-3">
              {run.log.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No detailed log captured for this run.
                </p>
              ) : (
                <ol className="space-y-2 font-mono text-xs">
                  {run.log.map((entry, index) => (
                    <li key={index} className="leading-relaxed">
                      <span className="text-muted-foreground/70">
                        {formatTime(entry.ts)}
                      </span>{" "}
                      <span className={LOG_LEVEL_CLASS[entry.level]}>
                        {entry.step ? `[${entry.step}] ` : ""}
                        {entry.message}
                      </span>
                      {entry.detail && (
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-background/60 p-2 text-[11px] text-muted-foreground">
                          {entry.detail}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
