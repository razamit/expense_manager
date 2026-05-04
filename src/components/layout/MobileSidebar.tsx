"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, CreditCard, ArrowLeftRight, Tag, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-outline-variant bg-sidebar shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-5">
          <div>
            <p className="text-base font-black tracking-[-0.02em] text-foreground">
              FinanceChecker
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
                  isActive
                    ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-outline-variant p-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <p className="app-eyebrow-label">Secure Session</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              Lock the workspace from the header at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
