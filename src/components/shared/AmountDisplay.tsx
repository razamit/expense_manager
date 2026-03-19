import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/amount-utils";

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  direction?: string;
  className?: string;
}

export function AmountDisplay({
  amount,
  currency = "ILS",
  direction,
  className,
}: AmountDisplayProps) {
  const resolvedDirection = direction ?? (amount >= 0 ? "income" : "expense");
  const colorClass =
    resolvedDirection === "income"
      ? "text-green-600"
      : resolvedDirection === "expense"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <span className={cn("font-mono tabular-nums", colorClass, className)}>
      {formatAmount(Math.abs(amount), currency)}
    </span>
  );
}
