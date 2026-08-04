"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Field, FieldRow, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { CATEGORIES, CATEGORY_COLORS, CURRENCIES, formatCurrency, todayLocalString } from "@/lib/constants";
import { periodStartDate } from "@/lib/gamification";
import type { Budget, Expense, GamificationResult } from "@/lib/types";
import styles from "./expenses.module.css";

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0] as string,
  amount: "",
  currency: "NGN",
  date: todayLocalString(),
};

export default function ExpensesPage() {
  const { refresh, notifyUnlocks } = useAppData();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [expensesData, budgetData] = await Promise.all([
      apiRequest<{ expenses: Expense[] }>("/api/expenses"),
      apiRequest<{ budget: Budget | null }>("/api/budget"),
    ]);
    setExpenses(expensesData.expenses);
    setBudget(budgetData.budget);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(
    () => (categoryFilter ? expenses.filter((e) => e.category === categoryFilter) : expenses),
    [expenses, categoryFilter]
  );

  const periodSpend = useMemo(() => {
    if (!budget) return 0;
    const start = periodStartDate(budget.period);
    return expenses.filter((e) => e.date >= start).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, budget]);

  const budgetStatus = useMemo(() => {
    if (!budget || budget.amount <= 0) return null;
    const pct = (periodSpend / budget.amount) * 100;
    const remaining = budget.amount - periodSpend;
    const status = remaining < 0 ? "over" : pct >= 80 ? "warning" : "ok";
    return { pct, remaining, status };
  }, [budget, periodSpend]);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      name: expense.name,
      category: expense.category,
      amount: String(expense.amount),
      currency: expense.currency,
      date: expense.date,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) throw new Error("Enter an amount greater than 0");

      if (editingId) {
        await apiRequest(`/api/expenses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            amount,
            currency: form.currency,
            date: form.date,
          }),
        });
      } else {
        const result = await apiRequest<GamificationResult>("/api/expenses", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            amount,
            currency: form.currency,
            date: form.date,
            timezoneOffset: clientTimezoneOffset(),
          }),
        });
        notifyUnlocks(result.newlyUnlocked);
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await Promise.all([loadAll(), refresh()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await apiRequest(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Expenses</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.side}>
          {budget ? (
            <Panel accent={budgetStatus?.status === "over" ? "coral" : "emerald"}>
              <h3>Budget · {budget.period}</h3>
              <div className={styles.budgetAmount}>
                {formatCurrency(periodSpend, budget.currency)}
                <span style={{ color: "var(--text-faint)", fontSize: "0.9rem" }}>
                  {" "}
                  / {formatCurrency(budget.amount, budget.currency)}
                </span>
              </div>
              <ProgressBar
                pct={budgetStatus?.pct ?? 0}
                color={budgetStatus?.status === "over" ? "coral" : budgetStatus?.status === "warning" ? "gold" : "emerald"}
              />
              <div
                className={`${styles.budgetRow} ${
                  budgetStatus?.status === "over"
                    ? styles.statusOver
                    : budgetStatus?.status === "warning"
                    ? styles.statusWarning
                    : styles.statusOk
                }`}
              >
                <span>
                  {budgetStatus && budgetStatus.remaining < 0
                    ? "Over budget"
                    : "Remaining"}
                </span>
                <span>{formatCurrency(Math.abs(budgetStatus?.remaining ?? 0), budget.currency)}</span>
              </div>
            </Panel>
          ) : null}

          <Panel accent="emerald">
            <h3>{editingId ? "Edit Expense" : "Log an Expense"}</h3>
            <form className={styles.form} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.85rem" }}>
              {error ? <div style={{ color: "var(--coral)", fontSize: "0.8rem" }}>{error}</div> : null}
              <Field label="Name" htmlFor="exp-name">
                <Input
                  id="exp-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Lunch, transport, rent..."
                />
              </Field>
              <Field label="Category" htmlFor="exp-category">
                <Select
                  id="exp-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <FieldRow>
                <Field label="Amount" htmlFor="exp-amount">
                  <Input
                    id="exp-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </Field>
                <Field label="Currency" htmlFor="exp-currency">
                  <Select
                    id="exp-currency"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  >
                    {Object.keys(CURRENCIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FieldRow>
              <Field label="Date" htmlFor="exp-date">
                <Input
                  id="exp-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
              <div className={styles.formActions}>
                <Button type="submit" variant="emerald" full disabled={submitting}>
                  {editingId ? "Save changes" : "Log expense"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </Panel>
        </div>

        <Panel>
          <div className={styles.filterRow}>
            <label htmlFor="filter-category">Category</label>
            <Select id="filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.empty}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>No expenses logged yet. Add your first one.</div>
            ) : (
              filtered.map((expense) => (
                <div className={styles.row} key={expense.id}>
                  <span className={styles.rowDate}>{expense.date.slice(5)}</span>
                  <span className={styles.rowName}>{expense.name}</span>
                  <Badge className={styles.rowCategory} style={{ color: CATEGORY_COLORS[expense.category] }}>{expense.category}</Badge>
                  <span className={styles.rowAmount}>{formatCurrency(expense.amount, expense.currency)}</span>
                  <div className={styles.rowActions}>
                    <button className={styles.iconBtn} onClick={() => startEdit(expense)} aria-label="Edit">
                      ✎
                    </button>
                    <button className={styles.iconBtn} onClick={() => handleDelete(expense.id)} aria-label="Delete">
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
