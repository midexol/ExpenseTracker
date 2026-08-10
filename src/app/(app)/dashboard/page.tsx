"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { CATEGORIES, CATEGORY_COLORS, formatCurrency, todayLocalString } from "@/lib/constants";
import { periodStartDate } from "@/lib/gamification";
import { ACHIEVEMENT_ICONS, type AchievementIconKey } from "@/components/icons/GameIcons";
import type { Achievement, Budget, Expense, GamificationResult, Todo } from "@/lib/types";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { me, refresh, notifyUnlocks } = useAppData();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [quickExpense, setQuickExpense] = useState({ name: "", category: CATEGORIES[0] as string, amount: "" });
  const [quickTodo, setQuickTodo] = useState("");

  const today = todayLocalString();

  async function loadAll() {
    const [todosData, expensesData, budgetData, achievementsData] = await Promise.all([
      apiRequest<{ todos: Todo[] }>("/api/todos?completed=false"),
      apiRequest<{ expenses: Expense[] }>("/api/expenses"),
      apiRequest<{ budget: Budget | null }>("/api/budget"),
      apiRequest<{ achievements: Achievement[] }>("/api/achievements"),
    ]);
    setTodos(todosData.todos);
    setExpenses(expensesData.expenses);
    setBudget(budgetData.budget);
    setAchievements(achievementsData.achievements);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const loggedToday = useMemo(() => expenses.some((e) => e.date === today), [expenses, today]);
  const dueTodos = useMemo(() => todos.filter((t) => t.dueDate && t.dueDate <= today), [todos, today]);

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

  const recentAchievements = useMemo(
    () =>
      achievements
        .filter((a) => a.unlockedAt)
        .sort((a, b) => new Date(b.unlockedAt as string).getTime() - new Date(a.unlockedAt as string).getTime())
        .slice(0, 4),
    [achievements]
  );

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

  return (
    <div>
      <div className={styles.header}>
        <h1>Welcome back{me?.name ? `, ${me.name}` : ""}</h1>
        <p>Level {me?.level ?? 1} adventurer · {me?.currentStreak ?? 0} day streak</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.col}>
          <Panel accent="violet">
            <h3>Today&apos;s Quests</h3>
            {dueTodos.length === 0 && loggedToday ? (
              <div className={styles.emptyQuests}>All caught up. Add a new quest below.</div>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                <div className={styles.questItem}>
                  <span className={`${styles.questCheck} ${styles.questCheckStatic} ${loggedToday ? styles.questDone : ""}`}>
                    {loggedToday ? "✓" : ""}
                  </span>
                  <span className={`${styles.questTitle} ${loggedToday ? styles.questDone : ""}`}>
                    Log today&apos;s spending
                  </span>
                  {!loggedToday ? (
                    <Button size="sm" variant="emerald" onClick={() => router.push("/expenses")}>
                      Log
                    </Button>
                  ) : null}
                </div>
                {dueTodos.map((t) => (
                  <div className={styles.questItem} key={t.id}>
                    <button className={styles.questCheck} onClick={() => toggleTodo(t)} aria-label="Complete" />
                    <span className={styles.questTitle}>
                      {t.title}
                      {t.recurrence === "DAILY" ? " (Daily)" : t.recurrence === "WEEKLY" ? " (Weekly)" : ""}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--gold)" }}>+{t.xpValue} XP</span>
                  </div>
                ))}
              </div>
            )}

            <form className={styles.quickForm} onSubmit={handleQuickTodo}>
              <input
                className={styles.quickNameInput}
                placeholder="Quick add a quest..."
                value={quickTodo}
                onChange={(e) => setQuickTodo(e.target.value)}
              />
              <Button type="submit" variant="violet" size="sm">
                Add
              </Button>
            </form>
          </Panel>

          <Panel accent="emerald">
            <h3>Quick Log an Expense</h3>
            <form className={styles.quickForm} onSubmit={handleQuickExpense}>
              <input
                className={styles.quickNameInput}
                placeholder="What did you spend on?"
                value={quickExpense.name}
                onChange={(e) => setQuickExpense((f) => ({ ...f, name: e.target.value }))}
              />
              <select
                value={quickExpense.category}
                onChange={(e) => setQuickExpense((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className={styles.quickAmountInput}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount"
                value={quickExpense.amount}
                onChange={(e) => setQuickExpense((f) => ({ ...f, amount: e.target.value }))}
              />
              <Button type="submit" variant="emerald" size="sm">
                Log
              </Button>
            </form>
          </Panel>
        </div>

        <div className={styles.col}>
          <Panel accent="gold">
            <h3>Spend by category · {budget?.period ?? "Monthly"}</h3>
            {categoryBreakdown.length === 0 ? (
              <div className={styles.emptyQuests}>Nothing logged this period yet.</div>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {categoryBreakdown.map((row) => (
                  <div className={styles.chartRow} key={row.category}>
                    <span className={styles.chartLabel}>{row.category}</span>
                    <div className={styles.chartTrack}>
                      <div
                        className={styles.chartFill}
                        style={{ width: `${row.pct}%`, background: CATEGORY_COLORS[row.category] }}
                      />
                    </div>
                    <span className={styles.chartValue}>{formatCurrency(row.amount, budget?.currency ?? "NGN")}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <h3>Recent Achievements</h3>
            {recentAchievements.length === 0 ? (
              <div className={styles.emptyQuests}>None yet — complete a quest or log an expense to start.</div>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {recentAchievements.map((a) => {
                  const Icon = ACHIEVEMENT_ICONS[a.icon as AchievementIconKey] ?? ACHIEVEMENT_ICONS.trophy;
                  return (
                    <div className={styles.achievementRow} key={a.id}>
                      <div className={styles.achievementIcon}>
                        <Icon width={16} height={16} />
                      </div>
                      <div>
                        <div className={styles.achievementName}>{a.name}</div>
                        <div className={styles.achievementDate}>
                          {new Date(a.unlockedAt as string).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="ghost" size="sm" style={{ marginTop: "0.85rem" }} onClick={() => router.push("/achievements")}>
              View all
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
