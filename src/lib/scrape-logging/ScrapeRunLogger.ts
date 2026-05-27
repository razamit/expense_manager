import { ScrapeLogFileWriter } from "./ScrapeLogFileWriter";
import { describeScrapeStep, type ScrapeLogEntry, type ScrapeLogLevel } from "./types";

export interface ScrapeRunLoggerContext {
  /** Credential owner / account name — used for the disk filename and header. */
  label: string;
  companyType: string;
}

/**
 * Collects a structured, timestamped log for a single scrape session (one
 * credential-owner group). Entries are buffered in memory for persistence to
 * the DB and simultaneously streamed to a per-run file on disk.
 */
export class ScrapeRunLogger {
  private readonly entries: ScrapeLogEntry[] = [];
  private readonly fileWriter: ScrapeLogFileWriter;

  constructor(context: ScrapeRunLoggerContext) {
    this.fileWriter = new ScrapeLogFileWriter(`${context.companyType}_${context.label}`);
    this.info(`Scrape session started for "${context.label}" (${context.companyType})`);
  }

  step(rawStep: string): void {
    this.record("step", describeScrapeStep(rawStep), { step: rawStep });
  }

  info(message: string): void {
    this.record("info", message);
  }

  warn(message: string, detail?: string): void {
    this.record("warn", message, { detail });
  }

  error(message: string, cause?: unknown): void {
    this.record("error", message, { detail: extractDetail(cause) });
  }

  getEntries(): ScrapeLogEntry[] {
    return this.entries;
  }

  serialize(): string {
    return JSON.stringify(this.entries);
  }

  get filePath(): string {
    return this.fileWriter.path;
  }

  /** Flushes buffered disk writes; call before the session ends. */
  async flush(): Promise<void> {
    await this.fileWriter.flush();
  }

  private record(
    level: ScrapeLogLevel,
    message: string,
    extra?: { step?: string; detail?: string }
  ): void {
    const entry: ScrapeLogEntry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...(extra?.step ? { step: extra.step } : {}),
      ...(extra?.detail ? { detail: extra.detail } : {}),
    };
    this.entries.push(entry);
    this.fileWriter.append(entry);
  }
}

function extractDetail(cause: unknown): string | undefined {
  if (cause == null) return undefined;
  if (cause instanceof Error) {
    return cause.stack ?? `${cause.name}: ${cause.message}`;
  }
  if (typeof cause === "string") return cause;
  try {
    return JSON.stringify(cause);
  } catch {
    return String(cause);
  }
}
