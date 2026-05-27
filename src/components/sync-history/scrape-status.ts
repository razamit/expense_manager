import type { BadgeProps } from "@/components/ui/badge";
import type { ScrapeLogLevel } from "@/types";

interface StatusDisplay {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
}

const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  completed: { label: "Completed", variant: "secondary" },
  error: { label: "Failed", variant: "destructive" },
  binding_needed: { label: "Needs binding", variant: "outline" },
  scraping: { label: "Scraping", variant: "default" },
  importing: { label: "Importing", variant: "default" },
  running: { label: "Running", variant: "default" },
};

export function describeStatus(status: string): StatusDisplay {
  return STATUS_DISPLAY[status] ?? { label: status, variant: "outline" };
}

export const LOG_LEVEL_CLASS: Record<ScrapeLogLevel, string> = {
  error: "text-destructive",
  warn: "text-warning",
  step: "text-primary",
  info: "text-muted-foreground",
};
