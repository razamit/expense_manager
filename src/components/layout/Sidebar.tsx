"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tag,
  BarChart3,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrape } from "@/context/ScrapeContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/sync-history", label: "Sync History", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isScraping } = useScrape();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-outline-variant bg-sidebar md:flex">
      <div className="border-b border-outline-variant px-6 py-6">
        <div className="min-w-0">
          <p className="text-lg font-black tracking-[-0.02em] text-foreground">
            FinanceChecker
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
                  isActive
                    ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/accounts" && isScraping && (
                  <span
                    className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-warning"
                    aria-label="Scraping in progress"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
