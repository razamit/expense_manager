import { promises as fs } from "fs";
import path from "path";
import type { ScrapeLogEntry } from "./types";

const LOG_ROOT = path.join(process.cwd(), "logs", "scrape");

function sanitizeForFilename(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "scrape";
}

function formatLine(entry: ScrapeLogEntry): string {
  const stepPart = entry.step ? ` [${entry.step}]` : "";
  const detailPart = entry.detail ? `\n    ${entry.detail.replace(/\n/g, "\n    ")}` : "";
  return `${entry.ts} ${entry.level.toUpperCase().padEnd(5)}${stepPart} ${entry.message}${detailPart}\n`;
}

/**
 * Appends scrape log entries to a per-run file on disk. Writes are serialized
 * through a promise chain so concurrent appends keep their order.
 */
export class ScrapeLogFileWriter {
  private readonly filePath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(label: string) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${stamp}_${sanitizeForFilename(label)}.log`;
    this.filePath = path.join(LOG_ROOT, fileName);
  }

  get path(): string {
    return this.filePath;
  }

  append(entry: ScrapeLogEntry): void {
    const line = formatLine(entry);
    this.writeChain = this.writeChain
      .then(() => fs.mkdir(LOG_ROOT, { recursive: true }))
      .then(() => fs.appendFile(this.filePath, line, "utf8"))
      .catch((err) => {
        // Disk logging is best-effort; never let it break a scrape.
        console.error("[ScrapeLogFileWriter] write failed", err);
      });
  }

  /** Resolves once every queued append has flushed to disk. */
  async flush(): Promise<void> {
    await this.writeChain;
  }
}
