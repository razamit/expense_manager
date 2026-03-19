export function normalizeToDateOnly(dateInput: string | Date): Date {
  const isoString =
    typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  const datePart = isoString.slice(0, 10);
  return new Date(`${datePart}T00:00:00.000Z`);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IL", {
    year: "numeric",
    month: "long",
  });
}

export function getMonthRange(year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

export function getMonthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}
