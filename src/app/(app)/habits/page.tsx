"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { todayLocalString } from "@/lib/constants";
import type { GamificationResult } from "@/lib/types";
import styles from "./habits.module.css";

interface Habit {
  id: string;
  title: string;
  category: string;
  color: "coral" | "violet" | "cyber" | "emerald" | "amber" | "cyan";
  icon: string;
  archived: boolean;
  createdAt: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

interface DailyMetric {
  id: string;
  date: string;
  sleepHrs: number | null;
  mood: number | null;
  stress: number | null;
  energy: number | null;
}

const COLOR_HEX: Record<string, string> = {
  coral: "#FF5D5D",
  violet: "#9B82F6",
  cyber: "#18ADF2",
  emerald: "#18ADF2",
  amber: "#8ECAE6",
  cyan: "#136286",
};

export default function HabitsPage() {
  const { refresh, notifyUnlocks } = useAppData();
  const [activeTab, setActiveTab] = useState<"widgets" | "journal">("widgets");

  // Habits Data
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);

  // Forms
  const [newHabit, setNewHabit] = useState({ title: "", category: "General", color: "coral" as Habit["color"] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [metricForm, setMetricForm] = useState({ sleepHrs: "", mood: "", stress: "" });

  const today = todayLocalString();

  // Load Habits Data
  async function loadHabitsData() {
    setLoadingHabits(true);
    const data = await apiRequest<{ habits: Habit[]; habitLogs: HabitLog[]; dailyMetrics: DailyMetric[] }>("/api/habits");
    setHabits(data.habits);
    setHabitLogs(data.habitLogs);
    setDailyMetrics(data.dailyMetrics);
    setLoadingHabits(false);
  }

  useEffect(() => {
    loadHabitsData();
  }, []);

  // Days array for past 28 days (Widget Heatmap)
  const heatmapDates = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const tzOffset = d.getTimezoneOffset() * 60000;
      dates.push(new Date(d.getTime() - tzOffset).toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  // Current Month days for Journal Grid
  const currentMonthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthStr = String(month + 1).padStart(2, "0");
    const dates: string[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, "0");
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
    return dates;
  }, []);

  // Quick map of completion per habitId -> set of date strings
  const logMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const log of habitLogs) {
      if (log.completed) {
        if (!map.has(log.habitId)) map.set(log.habitId, new Set());
        map.get(log.habitId)!.add(log.date);
      }
    }
    return map;
  }, [habitLogs]);

  // Toggle habit check for a specific date
  async function handleToggleHabit(habitId: string, date: string) {
    const result = await apiRequest<GamificationResult>("/api/habits/log", {
      method: "POST",
      body: JSON.stringify({ habitId, date, timezoneOffset: clientTimezoneOffset() }),
    });
    notifyUnlocks(result.newlyUnlocked);
    await Promise.all([loadHabitsData(), refresh()]);
  }

  // Create new habit
  async function handleCreateHabit(e: FormEvent) {
    e.preventDefault();
    if (!newHabit.title.trim()) return;
    await apiRequest("/api/habits", {
      method: "POST",
      body: JSON.stringify(newHabit),
    });
    setNewHabit({ title: "", category: "General", color: "coral" });
    setShowAddForm(false);
    await loadHabitsData();
  }

  // Update habit
  async function handleUpdateHabit(e: FormEvent) {
    e.preventDefault();
    if (!editingHabit || !editingHabit.title.trim()) return;
    await apiRequest(`/api/habits/${editingHabit.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: editingHabit.title,
        category: editingHabit.category,
        color: editingHabit.color,
      }),
    });
    setEditingHabit(null);
    await loadHabitsData();
  }

  // Delete habit
  async function handleDeleteHabit(habitId: string, habitTitle: string) {
    if (!confirm(`Are you sure you want to remove the habit "${habitTitle}"?`)) return;
    await apiRequest(`/api/habits/${habitId}`, {
      method: "DELETE",
    });
    if (editingHabit?.id === habitId) setEditingHabit(null);
    await loadHabitsData();
  }

  // Log Daily Metrics
  async function handleLogMetrics(e: FormEvent) {
    e.preventDefault();
    const sleepHrs = metricForm.sleepHrs ? parseFloat(metricForm.sleepHrs) : null;
    const mood = metricForm.mood ? parseInt(metricForm.mood, 10) : null;
    const stress = metricForm.stress ? parseInt(metricForm.stress, 10) : null;
    await apiRequest("/api/habits/metrics", {
      method: "POST",
      body: JSON.stringify({ date: today, sleepHrs, mood, stress }),
    });
    setMetricForm({ sleepHrs: "", mood: "", stress: "" });
    await loadHabitsData();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Habit Rituals Center</h1>
          <p>Forging discipline through daily repetition. Track consistency & extended journal metrics.</p>
        </div>

        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === "widgets" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("widgets")}
          >
            Widget Dashboard
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "journal" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            Extended Journal Grid
          </button>
        </div>
      </div>

      {/* --- TAB 1: WIDGET DASHBOARD --- */}
      {activeTab === "widgets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontWeight: 600 }}>
              {habits.length} Active Habits · Past 28 Days Heatmap
            </span>
            <Button
              variant="violet"
              size="sm"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingHabit(null);
              }}
            >
              {showAddForm ? "Cancel" : "+ Add Habit"}
            </Button>
          </div>

          {showAddForm && (
            <Panel accent="violet">
              <h3>New Habit Widget</h3>
              <form onSubmit={handleCreateHabit} style={{ display: "flex", gap: "0.75rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                <Field label="Habit Name" htmlFor="habit-title">
                  <Input
                    id="habit-title"
                    required
                    placeholder="Deep Work, Journal, Meditate..."
                    value={newHabit.title}
                    onChange={(e) => setNewHabit((h) => ({ ...h, title: e.target.value }))}
                  />
                </Field>

                <Field label="Category" htmlFor="habit-cat">
                  <Input
                    id="habit-cat"
                    placeholder="Mind, Health, Work..."
                    value={newHabit.category}
                    onChange={(e) => setNewHabit((h) => ({ ...h, category: e.target.value }))}
                  />
                </Field>

                <Field label="Color Theme" htmlFor="habit-color">
                  <Select
                    id="habit-color"
                    value={newHabit.color}
                    onChange={(e) => setNewHabit((h) => ({ ...h, color: e.target.value as Habit["color"] }))}
                  >
                    <option value="coral">Coral Red</option>
                    <option value="violet">Violet Blue</option>
                    <option value="cyber">Cyber Blue</option>
                    <option value="emerald">Ocean Blue</option>
                    <option value="amber">Sky Blue</option>
                    <option value="cyan">Deep Slate</option>
                  </Select>
                </Field>

                <div style={{ alignSelf: "flex-end" }}>
                  <Button type="submit" variant="emerald" size="sm">
                    Create Widget ↗
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {editingHabit && (
            <Panel accent="violet">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Edit Habit Widget</h3>
                <Button size="sm" variant="ghost" onClick={() => setEditingHabit(null)}>
                  Cancel
                </Button>
              </div>
              <form onSubmit={handleUpdateHabit} style={{ display: "flex", gap: "0.75rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                <Field label="Habit Name" htmlFor="edit-habit-title">
                  <Input
                    id="edit-habit-title"
                    required
                    placeholder="Habit Title..."
                    value={editingHabit.title}
                    onChange={(e) => setEditingHabit((h) => (h ? { ...h, title: e.target.value } : null))}
                  />
                </Field>

                <Field label="Category" htmlFor="edit-habit-cat">
                  <Input
                    id="edit-habit-cat"
                    placeholder="Category..."
                    value={editingHabit.category}
                    onChange={(e) => setEditingHabit((h) => (h ? { ...h, category: e.target.value } : null))}
                  />
                </Field>

                <Field label="Color Theme" htmlFor="edit-habit-color">
                  <Select
                    id="edit-habit-color"
                    value={editingHabit.color}
                    onChange={(e) => setEditingHabit((h) => (h ? { ...h, color: e.target.value as Habit["color"] } : null))}
                  >
                    <option value="coral">Coral Red</option>
                    <option value="violet">Violet Blue</option>
                    <option value="cyber">Cyber Blue</option>
                    <option value="emerald">Ocean Blue</option>
                    <option value="amber">Sky Blue</option>
                    <option value="cyan">Deep Slate</option>
                  </Select>
                </Field>

                <div style={{ alignSelf: "flex-end", display: "flex", gap: "0.5rem" }}>
                  <Button type="submit" variant="emerald" size="sm">
                    Save Changes ↗
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteHabit(editingHabit.id, editingHabit.title)}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {loadingHabits ? (
            <div style={{ color: "var(--text-faint)", padding: "2rem 0" }}>Loading habit widgets...</div>
          ) : (
            <div className={styles.widgetGrid}>
              {habits.map((habit) => {
                const datesDone = logMap.get(habit.id) ?? new Set();
                const isTodayDone = datesDone.has(today);
                const colorHex = COLOR_HEX[habit.color] ?? COLOR_HEX.coral;
                const cellClass = `cell${habit.color.charAt(0).toUpperCase() + habit.color.slice(1)}`;

                return (
                  <div className={styles.widgetCard} key={habit.id}>
                    <div className={styles.widgetCardHeader}>
                      <div className={styles.habitTitleBlock}>
                        <div className={styles.colorBadge} style={{ background: colorHex }} />
                        <div>
                          <div className={styles.habitTitle}>{habit.title}</div>
                          <div className={styles.habitCategory}>{habit.category}</div>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setEditingHabit(habit);
                            setShowAddForm(false);
                          }}
                          title="Edit Habit"
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteHabit(habit.id, habit.title)}
                          title="Remove Habit"
                        >
                          Delete
                        </button>
                        <button
                          className={`${styles.checkBtn} ${isTodayDone ? styles.checkBtnCompleted : ""}`}
                          onClick={() => handleToggleHabit(habit.id, today)}
                          aria-label="Toggle today check-in"
                        >
                          ✓
                        </button>
                      </div>
                    </div>

                    <div className={styles.heatmapWrap}>
                      <div className={styles.heatmapGrid}>
                        {heatmapDates.map((date) => {
                          const isDone = datesDone.has(date);
                          return (
                            <div
                              key={date}
                              title={`${date}: ${isDone ? "Completed" : "Not logged"}`}
                              className={`${styles.heatmapCell} ${isDone ? styles[cellClass] : ""}`}
                              onClick={() => handleToggleHabit(habit.id, date)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.widgetFooter}>
                      <span className={styles.streakBadge}>
                        STREAK: {datesDone.size} DAYS
                      </span>
                      <span>
                        {Math.round((datesDone.size / 28) * 100)}% CONSISTENCY
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: EXTENDED JOURNAL GRID & METRICS --- */}
      {activeTab === "journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Panel accent="violet">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3>Today&apos;s Journal Metrics</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{today}</span>
            </div>

            <form onSubmit={handleLogMetrics} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <Field label="Sleep (Hours)" htmlFor="metric-sleep">
                <Input
                  id="metric-sleep"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="e.g. 7.5"
                  value={metricForm.sleepHrs}
                  onChange={(e) => setMetricForm((m) => ({ ...m, sleepHrs: e.target.value }))}
                />
              </Field>

              <Field label="Mood (1 - 10)" htmlFor="metric-mood">
                <Input
                  id="metric-mood"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1 to 10"
                  value={metricForm.mood}
                  onChange={(e) => setMetricForm((m) => ({ ...m, mood: e.target.value }))}
                />
              </Field>

              <Field label="Stress (1 - 10)" htmlFor="metric-stress">
                <Input
                  id="metric-stress"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1 to 10"
                  value={metricForm.stress}
                  onChange={(e) => setMetricForm((m) => ({ ...m, stress: e.target.value }))}
                />
              </Field>

              <div style={{ alignSelf: "flex-end" }}>
                <Button type="submit" variant="emerald" size="sm">
                  Log Metrics ↗
                </Button>
              </div>
            </form>
          </Panel>

          <div className={styles.journalWrap}>
            <div className={styles.journalHeader}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Monthly Discipline Grid</div>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Current Month Days</span>
            </div>

            <table className={styles.journalGridTable}>
              <thead>
                <tr>
                  <th className={styles.habitRowHeader}>Habit Name</th>
                  {currentMonthDays.map((date) => (
                    <th key={date} style={{ fontSize: "0.72rem", width: "24px" }}>
                      {parseInt(date.slice(8), 10)}
                    </th>
                  ))}
                  <th style={{ width: "60px" }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const datesDone = logMap.get(habit.id) ?? new Set();
                  const colorHex = COLOR_HEX[habit.color] ?? COLOR_HEX.coral;
                  let monthCount = 0;
                  currentMonthDays.forEach((d) => {
                    if (datesDone.has(d)) monthCount++;
                  });
                  const ratePct = Math.round((monthCount / currentMonthDays.length) * 100);

                  return (
                    <tr key={habit.id}>
                      <td className={styles.habitRowHeader}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: colorHex, marginRight: "0.5rem" }} />
                        {habit.title}
                        <button
                          className={styles.actionBtn}
                          style={{ marginLeft: "0.5rem", padding: "0.15rem 0.4rem", fontSize: "0.68rem" }}
                          onClick={() => {
                            setActiveTab("widgets");
                            setEditingHabit(habit);
                            setShowAddForm(false);
                          }}
                          title="Edit habit"
                        >
                          Edit
                        </button>
                      </td>
                      {currentMonthDays.map((date) => {
                        const isDone = datesDone.has(date);
                        return (
                          <td key={date} style={{ padding: "0.2rem" }}>
                            <div
                              className={`${styles.gridDot} ${isDone ? styles.gridDotFilled : ""}`}
                              style={isDone ? { background: colorHex } : {}}
                              onClick={() => handleToggleHabit(habit.id, date)}
                              title={`${habit.title} on ${date}: ${isDone ? "Done" : "Click to toggle"}`}
                            />
                          </td>
                        );
                      })}
                      <td style={{ fontWeight: 700, color: colorHex }}>{ratePct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
