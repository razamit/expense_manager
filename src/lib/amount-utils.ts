const ILS_FORMATTER = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const FORMATTERS: Record<string, Intl.NumberFormat> = {
  ILS: ILS_FORMATTER,
  USD: USD_FORMATTER,
};

export function formatAmount(
  amount: number,
  currency: string = "ILS"
): string {
  const formatter = FORMATTERS[currency] ?? ILS_FORMATTER;
  return formatter.format(amount);
}

export function formatAmountSigned(
  amount: number,
  currency: string = "ILS"
): string {
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${formatAmount(amount, currency)}`;
}

export function detectDirection(
  amount: number
): "income" | "expense" | "transfer" {
  if (amount > 0) return "income";
  if (amount < 0) return "expense";
  return "transfer";
}

export function absAmount(amount: number): number {
  return Math.abs(amount);
}
