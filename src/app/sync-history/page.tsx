"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncRunRow } from "@/components/sync-history/SyncRunRow";
import { SyncRunLogDialog } from "@/components/sync-history/SyncRunLogDialog";
import { useSyncHistoryViewModel } from "@/viewmodels/useSyncHistoryViewModel";

export default function SyncHistoryPage() {
  const vm = useSyncHistoryViewModel();

  return (
    <div className="app-page-shell">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="app-eyebrow-label">Diagnostics</p>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
            Sync History
          </h1>
          <p className="text-sm text-muted-foreground">
            Every scrape run with its step-by-step log. Open a failed run to see
            exactly where it broke.
          </p>
        </div>

        <Button variant="outline" onClick={vm.refresh} disabled={vm.isLoading}>
          <RefreshCw className={`h-4 w-4 ${vm.isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {vm.error ? (
        <div className="app-surface-card flex min-h-[160px] items-center justify-center p-6 text-center">
          <p className="text-sm text-destructive">{vm.error}</p>
        </div>
      ) : vm.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sync history...</p>
      ) : vm.runs.length === 0 ? (
        <div className="app-surface-card flex min-h-[160px] items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No scrape runs recorded yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {vm.runs.map((run) => (
            <SyncRunRow key={run.id} run={run} onOpen={vm.openRun} />
          ))}
        </div>
      )}

      <SyncRunLogDialog
        run={vm.selectedRun}
        isLoading={vm.isLoadingDetail}
        onClose={vm.closeRun}
      />
    </div>
  );
}
