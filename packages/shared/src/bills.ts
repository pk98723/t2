// Bills/recurring projections — pure logic for computing upcoming bill dates.
import { addDays, addMonths, addWeeks, formatDistanceToNow, parseISO } from "date-fns";

export interface BillProjection {
  id: string;
  nextDate: Date;
  amount: number;
  description: string | null;
}

export function computeNextOccurrences(
  transactionDate: string,
  recurringInterval: string | null,
  count = 6
): Date[] {
  const baseDate = parseISO(transactionDate);
  const dates: Date[] = [];
  const interval = recurringInterval || "monthly";

  for (let i = 0; i < count; i++) {
    let next: Date;
    switch (interval) {
      case "daily":
        next = addDays(baseDate, i + 1);
        break;
      case "weekly":
        next = addWeeks(baseDate, i + 1);
        break;
      case "bi-weekly":
        next = addWeeks(baseDate, (i + 1) * 2);
        break;
      case "monthly":
        next = addMonths(baseDate, i + 1);
        break;
      case "quarterly":
        next = addMonths(baseDate, (i + 1) * 3);
        break;
      case "annual":
        next = addMonths(baseDate, (i + 1) * 12);
        break;
      default:
        next = addMonths(baseDate, i + 1);
    }
    dates.push(next);
  }
  return dates;
}

export function getRelativeDueLabel(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getIntervalLabel(interval: string | null): string {
  switch (interval) {
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "bi-weekly": return "Bi-weekly";
    case "monthly": return "Monthly";
    case "quarterly": return "Quarterly";
    case "annual": return "Annual";
    default: return "Recurring";
  }
}

export function getDueUrgencyColor(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "bg-destructive";
  if (diffDays <= 3) return "bg-warning";
  return "bg-success";
}