"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { CATEGORIES, CATEGORY_COLORS, formatCurrency, todayLocalString } from "@/lib/constants";
import { periodStartDate } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Budget, Expense, GamificationResult, Todo } from "@/lib/types";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { me, refresh, notifyUnlocks } = useAppData();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [activityGrid, setActivityGrid] = useState<Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>>([]);
  const [quickExpense, setQuickExpense] = useState({ name: "", category: CATEGORIES[0] as string, amount: "" });
  const [quickTodo, setQuickTodo] = useState("");

  const today = todayLocalString();

  async function loadAll() {
    const tz = clientTimezoneOffset();
    const [todosData, expensesData, budgetData, analyticsData] = await Promise.all([
      apiRequest<{ todos: Todo[] }>("/api/todos?completed=false"),
      apiRequest<{ expenses: Expense[] }>("/api/expenses"),
      apiRequest<{ budget: Budget | null }>("/api/budget"),
      apiRequest<{ activityGrid: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> }>(`/api/analytics?tzOffset=${tz}`),
    ]);
    setTodos(todosData.todos);
    setExpenses(expensesData.expenses);
    setBudget(budgetData.budget);
    setActivityGrid(analyticsData.activityGrid);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const loggedToday = useMemo(() => expenses.some((e) => e.date === today), [expenses, today]);
  const dueTodos = useMemo(() => todos.filter((t) => t.dueDate && t.dueDate <= today), [todos, today]);

  const recentExpenses = useMemo(() => expenses.slice(0, 4), [expenses]);

  const categoryBreakdown = useMemo(() => {
    const start = periodStartDate(budget?.period ?? "Monthly");
    const inPeriod = expenses.filter((e) => e.date >= start);
    const totals = new Map<string, number>();
    for (const e of inPeriod) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    const max = Math.max(1, ...Array.from(totals.values()));
    return CATEGORIES.map((c) => ({ category: c, amount: totals.get(c) ?? 0, pct: ((totals.get(c) ?? 0) / max) * 100 })).filter(
      (row) => row.amount > 0
    );
  }, [expenses, budget]);

  async function toggleTodo(todo: Todo) {
    const result = await apiRequest<GamificationResult>(`/api/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true, timezoneOffset: clientTimezoneOffset() }),
    });
    notifyUnlocks(result.newlyUnlocked);
    await Promise.all([loadAll(), refresh()]);
  }

  async function handleQuickExpense(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(quickExpense.amount);
    if (!quickExpense.name || !amount || amount <= 0) return;
    const result = await apiRequest<GamificationResult>("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        name: quickExpense.name,
        category: quickExpense.category,
        amount,
        currency: budget?.currency ?? "NGN",
        date: today,
        timezoneOffset: clientTimezoneOffset(),
      }),
    });
    notifyUnlocks(result.newlyUnlocked);
    setQuickExpense({ name: "", category: CATEGORIES[0] as string, amount: "" });
    await Promise.all([loadAll(), refresh()]);
  }

  async function handleQuickTodo(e: FormEvent) {
    e.preventDefault();
    if (!quickTodo.trim()) return;
    await apiRequest("/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: quickTodo, priority: "Med" }),
    });
    setQuickTodo("");
    await loadAll();
  }

  const initialLetter = me?.name ? me.name[0].toUpperCase() : "Q";

  return (
    <div>
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back, {me?.name ?? "Adventurer"}. Your next objective awaits.</p>
      </div>

      <div className={styles.bentoGrid}>
        <div className={styles.colMain}>
          {/* Hero Profile Rank Card */}
          <div className={styles.heroCard}>
            <div className={styles.avatarRingLarge}>
              <div className={styles.avatarInnerLarge}>{initialLetter}</div>
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", color: "var(--text)" }}>Focused Adept</h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                Level {me?.level ?? 1} Paladin · {me?.currentStreak ?? 0} Day Streak
              </div>
            </div>

            <div style={{ width: "100%", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                <span>Experience</span>
                <span>{me ? `${me.xpIntoLevel} / ${me.xpForNextLevel} XP` : "0 XP"}</span>
              </div>
              <ProgressBar pct={me?.progressPct ?? 0} color="gold" segments={12} />
            </div>

            <div className={styles.statRow}>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{me?.coins ?? 0} g</div>
                <div className={styles.statBoxLbl}>Gold Vault</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>100 / 100</div>
                <div className={styles.statBoxLbl}>Budget Capacity</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{me?.currentStreak ?? 0} Days</div>
                <div className={styles.statBoxLbl}>Streak</div>
              </div>
            </div>
          </div>

          {/* Current Objectives Card */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Current Objectives</h3>
              <Button size="sm" variant="ghost" onClick={() => router.push("/todos")}>
                View All ↗
              </Button>
            </div>

            <div style={{ marginTop: "0.75rem" }}>
              <div className={styles.objectiveRow}>
                <span className={`${styles.diffBadge} ${loggedToday ? styles.diffEasy : styles.diffEpic}`}>
                  {loggedToday ? "DONE" : "DAILY"}
                </span>
                <span className={styles.objTitle} style={{ textDecoration: loggedToday ? "line-through" : "none" }}>
                  Log today&apos;s spending
                </span>
                {!loggedToday ? (
                  <Button size="sm" variant="emerald" onClick={() => router.push("/expenses")}>
                    Log
                  </Button>
                ) : null}
              </div>

              {dueTodos.map((t) => {
                const diffClass = t.priority === "High" ? styles.diffEpic : t.priority === "Med" ? styles.diffNormal : styles.diffEasy;
                return (
                  <div className={styles.objectiveRow} key={t.id}>
                    <span className={`${styles.diffBadge} ${diffClass}`}>{t.priority.toUpperCase()}</span>
                    <span className={styles.objTitle}>
                      {t.title}
                      {t.recurrence === "DAILY" ? " (Daily)" : t.recurrence === "WEEKLY" ? " (Weekly)" : ""}
                    </span>
                    <Button size="sm" variant="primary" onClick={() => toggleTodo(t)}>
                      Complete (+{t.xpValue} XP)
                    </Button>
                  </div>
                );
              })}
            </div>

            <form className={styles.quickForm} onSubmit={handleQuickTodo}>
              <input
                className={styles.quickInput}
                placeholder="Quick add objective..."
                value={quickTodo}
                onChange={(e) => setQuickTodo(e.target.value)}
              />
              <Button type="submit" variant="primary" size="sm">
                Add ↗
              </Button>
            </form>
          </Panel>

          {/* Skill Grind Heatmap (Past 30 Days) */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Skill Grind (Last 30 Days)</h3>
              <button
                onClick={() => router.push("/analytics")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--highlight)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Full Analytics ↗
              </button>
            </div>
            <div className={styles.heatGrid}>
              {activityGrid.slice(-30).map((item) => (
                <div
                  key={item.date}
                  className={`${styles.heatCell} ${styles[`heatCellLevel${item.level}`]}`}
                  title={`${item.date}: ${item.count} activity actions`}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div className={styles.colSide}>
          {/* Quick Expense Logger */}
          <Panel accent="forest">
            <h3>Gold Tracker Vault</h3>
            <form onSubmit={handleQuickExpense} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
              <input
                className={styles.quickInput}
                placeholder="Item / Expense Name"
                value={quickExpense.name}
                onChange={(e) => setQuickExpense((f) => ({ ...f, name: e.target.value }))}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={quickExpense.category}
                  onChange={(e) => setQuickExpense((f) => ({ ...f, category: e.target.value }))}
                  className={styles.quickInput}
                  style={{ flex: 1 }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.quickInput}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount"
                  style={{ width: "100px" }}
                  value={quickExpense.amount}
                  onChange={(e) => setQuickExpense((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <Button type="submit" variant="emerald" size="sm" style={{ alignSelf: "flex-end" }}>
                Log Gold Spent ↗
              </Button>
            </form>
          </Panel>

          {/* Category Breakdown */}
          <Panel>
            <h3>Loot Distribution ({budget?.period ?? "Monthly"})</h3>
            {categoryBreakdown.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "1rem 0", fontSize: "0.85rem" }}>
                No expenses logged this period.
              </div>
            ) : (
              <div style={{ marginTop: "0.75rem" }}>
                {categoryBreakdown.map((row) => (
                  <div key={row.category} style={{ margin: "0.6rem 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      <span>{row.category}</span>
                      <span style={{ fontWeight: 800 }}>{formatCurrency(row.amount, budget?.currency ?? "NGN")}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-alt)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${row.pct}%`, background: CATEGORY_COLORS[row.category] ?? "var(--highlight)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Recent Bounties */}
          <Panel>
            <h3>Recent Bounties</h3>
            {recentExpenses.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "1rem 0", fontSize: "0.85rem" }}>No bounties recorded yet.</div>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {recentExpenses.map((exp) => (
                  <div className={styles.bountyRow} key={exp.id}>
                    <div>
                      <div className={styles.bountyName}>{exp.name}</div>
                      <div className={styles.bountyCat}>{exp.category} · {exp.date}</div>
                    </div>
                    <div className={styles.bountyAmount}>
                      -{formatCurrency(exp.amount, exp.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
