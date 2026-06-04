// Ported from Python expenses.py logic

export const CATEGORIES = [
  "Food",
  "Home",
  "Work",
  "Transportation",
  "Fun",
  "Miscellaneous",
];

export const CURRENCIES = {
  NGN: { symbol: "₦", rate: 1400 },
  USD: { symbol: "$", rate: 1 },
};

// --- Expense model ---
export function createExpense({ name, category, amount, date }) {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    amount: parseFloat(amount),
    date: date || new Date().toISOString().split("T")[0],
  };
}

// --- Budget helpers ---
export function getRemainingDays(budgetType) {
  const today = new Date();

  if (budgetType === "Monthly") {
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const diff = lastDay.getDate() - today.getDate();
    return diff + 1;
  } else {
    // Weekly — days until Sunday
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    return daysUntilSunday;
  }
}

export function getDailyAllowance(remaining, budgetType) {
  const days = getRemainingDays(budgetType);
  return days > 0 ? remaining / days : 0;
}

export function getBudgetStatus(totalSpent, budget) {
  if (budget <= 0) return null;
  const remaining = budget - totalSpent;
  const percentage = (totalSpent / budget) * 100;

  let status = "ok";
  if (remaining < 0) status = "over";
  else if (percentage >= 80) status = "warning";

  return { remaining, percentage, status };
}

// --- Expense summaries ---
export function groupByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
}

export function groupByMonth(expenses) {
  return expenses.reduce((acc, expense) => {
    const month = expense.date.slice(0, 7); // "YYYY-MM"
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {});
}

export function getTotalSpent(expenses) {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

// --- Currency conversion ---
export function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = CURRENCIES[fromCurrency].rate;
  const toRate = CURRENCIES[toCurrency].rate;
  return (amount / fromRate) * toRate;
}

// --- LocalStorage persistence ---
const STORAGE_KEYS = {
  expenses: "expense_tracker_expenses",
  budget: "expense_tracker_budget",
};

export function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.expenses);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
}

export function loadBudgetSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.budget);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { amount: 0, type: "Monthly", currency: "NGN" };
}

export function saveBudgetSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(settings));
}

// --- Formatting ---
export function formatCurrency(amount, currency) {
  const sym = CURRENCIES[currency]?.symbol || "₦";
  return `${sym}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMonth(yyyyMM) {
  const [year, month] = yyyyMM.split("-");
  return new Date(year, parseInt(month) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}
