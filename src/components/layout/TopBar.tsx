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
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={onScrapeClick}
          disabled={isScraping}
        >
          <RefreshCw className={`h-4 w-4 ${isScraping ? "animate-spin" : ""}`} />
          {isScraping ? "Updating..." : "Update"}
        </Button>

        <Button variant="ghost" size="icon" onClick={onLockClick}>
          <Lock className="h-4 w-4" />
        </Button>
      </header>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
