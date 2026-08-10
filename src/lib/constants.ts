export const CATEGORIES = [
  "Food",
  "Home",
  "Work",
  "Transportation",
  "Fun",
  "Miscellaneous",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#2ED573",
  Home: "#8C7AE6",
  Work: "#4FA3F7",
  Transportation: "#F5B700",
  Fun: "#FF5D5D",
  Miscellaneous: "#9A9FAE",
};

export const CURRENCIES: Record<string, { symbol: string; rate: number }> = {
  NGN: { symbol: "₦", rate: 1 },
  USD: { symbol: "$", rate: 1 / 1400 },
};

export const PRIORITIES = ["Low", "Med", "High"] as const;

export const RECURRENCE_OPTIONS = ["NONE", "DAILY", "WEEKLY"] as const;
export type RecurrenceType = (typeof RECURRENCE_OPTIONS)[number];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
};

export function formatCurrency(amount: number, currency: string) {
  const sym = CURRENCIES[currency]?.symbol ?? "₦";
  return `${sym}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function todayLocalString() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}
