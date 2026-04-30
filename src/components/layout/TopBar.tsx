"use client";

import { useState } from "react";
import { Menu, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./MobileSidebar";

interface TopBarProps {
  onScrapeClick: () => void;
  onLockClick: () => void;
  isScraping: boolean;
}

export function TopBar({ onScrapeClick, onLockClick, isScraping }: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur supports-[backdrop-filter]:bg-surface-container-lowest/88">
        <div className="flex h-16 items-center gap-3 px-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="app-eyebrow-label hidden md:block">Finance Workspace</p>
            <div className="flex items-center gap-3">
              <p className="truncate text-sm font-medium text-foreground">
                {isScraping ? "Syncing account data" : "Automated bank sync ready"}
              </p>
              <span
                className={`hidden h-2 w-2 rounded-full sm:inline-flex ${
                  isScraping ? "animate-pulse bg-warning" : "bg-positive"
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={onLockClick}
            >
              <Lock className="h-4 w-4" />
              Lock App
            </Button>

            <Button
              size="sm"
              onClick={onScrapeClick}
              disabled={isScraping}
            >
              <RefreshCw className={`h-4 w-4 ${isScraping ? "animate-spin" : ""}`} />
              {isScraping ? "Updating..." : "Update All"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={onLockClick}
              aria-label="Lock app"
            >
              <Lock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
