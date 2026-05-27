// Pure types for scrape logging. MUST stay free of node-only imports (fs, path)
// so client components can import ScrapeLogEntry without pulling server modules
// into the browser bundle.

export type ScrapeLogLevel = "info" | "step" | "warn" | "error";

export interface ScrapeLogEntry {
  /** ISO timestamp of when the entry was recorded. */
  ts: string;
  level: ScrapeLogLevel;
  /** Scraper lifecycle step (ScraperProgressTypes value) for level "step". */
  step?: string;
  message: string;
  /** Extra context: stack trace, errorType, raw error message, etc. */
  detail?: string;
}

/** Human-readable labels for the raw ScraperProgressTypes step values. */
export const SCRAPE_STEP_LABELS: Record<string, string> = {
  INITIALIZING: "Initializing browser",
  START_SCRAPING: "Starting scrape",
  LOGGING_IN: "Logging in",
  LOGIN_SUCCESS: "Login succeeded",
  LOGIN_FAILED: "Login failed",
  CHANGE_PASSWORD: "Password change required",
  END_SCRAPING: "Finished fetching transactions",
  TERMINATING: "Closing browser",
};

export function describeScrapeStep(step: string): string {
  return SCRAPE_STEP_LABELS[step] ?? step;
}
