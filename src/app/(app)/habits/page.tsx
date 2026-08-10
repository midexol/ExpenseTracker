"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

interface Challenge75 {
  id: string;
  status: "NOT_STARTED" | "ACTIVE" | "COMPLETED" | "FAILED";
  startDate: string | null;
  currentDay: number;
  attemptCount: number;
  failedDate: string | null;
}

interface Challenge75Log {
  id: string;
  date: string;
  dayNumber: number;
  attemptNumber: number;
  diet: boolean;
  water: boolean;
  workouts: boolean;
  reading: boolean;
  photo: boolean;
  allCompleted: boolean;
}

const COLOR_HEX: Record<string, string> = {
  coral: "#FF4757",
  violet: "#8A2BE2",
  cyber: "#3B82F6",
  emerald: "#10B981",
  amber: "#FFC048",
  cyan: "#00D2D3",
};

const RULES = [
  { id: "diet", label: "Follow Diet (No cheat meals, no alcohol)" },
  { id: "water", label: "Drink 1 Gallon of Water" },
  { id: "workouts", label: "2x 45-min Workouts (1 outdoor)" },
  { id: "reading", label: "Read 10 Pages of Non-Fiction" },
  { id: "photo", label: "Progress Check-in & Photo" },
] as const;

export default function HabitsPage() {
  const { refresh, notifyUnlocks } = useAppData();
  const [activeTab, setActiveTab] = useState<"widgets" | "journal" | "75hard">("widgets");

  // Habits Data
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);

  // 75 Hard Data
  const [challenge, setChallenge] = useState<Challenge75 | null>(null);
  const [challengeLogs, setChallengeLogs] = useState<Challenge75Log[]>([]);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // Forms
  const [newHabit, setNewHabit] = useState({ title: "", category: "General", color: "coral" as Habit["color"] });
  const [showAddForm, setShowAddForm] = useState(false);
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

  // Load 75 Hard Data
  async function loadChallengeData() {
    setLoadingChallenge(true);
    const tz = clientTimezoneOffset();
    const data = await apiRequest<{ challenge: Challenge75 | null; logs: Challenge75Log[] }>(`/api/challenge75?tzOffset=${tz}`);
    setChallenge(data.challenge);
    setChallengeLogs(data.logs);
    setLoadingChallenge(false);
  }

  useEffect(() => {
    loadHabitsData();
    loadChallengeData();
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

  // Start or Restart 75 Hard
  async function handleChallengeAction(action: "START" | "RESTART") {
    await apiRequest("/api/challenge75", {
      method: "POST",
      body: JSON.stringify({ action, timezoneOffset: clientTimezoneOffset() }),
    });
    await loadChallengeData();
  }

  // Toggle 75 Hard rule check for today
  async function handleToggleRule(rule: (typeof RULES)[number]["id"]) {
    const result = await apiRequest<GamificationResult>("/api/challenge75/log", {
      method: "POST",
      body: JSON.stringify({ date: today, rule, timezoneOffset: clientTimezoneOffset() }),
    });
    notifyUnlocks(result.newlyUnlocked);
    await Promise.all([loadChallengeData(), refresh()]);
  }

  const todayChallengeLog = useMemo(
    () => challengeLogs.find((l) => l.date === today),
    [challengeLogs, today]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Habits & 75 Hard Hub</h1>
          <p>Track daily consistency, extended journal metrics, and the 75 Hard challenge</p>
        </div>

        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === "widgets" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("widgets")}
          >
            <span className={styles.iconAvatar} style={{ background: "rgba(138, 43, 226, 0.2)", color: "#8A2BE2" }}>
              HT
            </span>
            Widget Dashboard
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "journal" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            <span className={styles.iconAvatar} style={{ background: "rgba(59, 130, 246, 0.2)", color: "#3B82F6" }}>
              JN
            </span>
            Extended Journal Grid
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "75hard" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("75hard")}
          >
            <span className={styles.iconAvatar} style={{ background: "rgba(245, 158, 11, 0.2)", color: "#F59E0B" }}>
              75
            </span>
            75 Hard Challenge
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
            <Button variant="violet" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "Add Habit"}
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

                <Field label="Glow Color" htmlFor="habit-color">
                  <Select
                    id="habit-color"
                    value={newHabit.color}
                    onChange={(e) => setNewHabit((h) => ({ ...h, color: e.target.value as Habit["color"] }))}
                  >
                    <option value="coral">Coral Red</option>
                    <option value="violet">Electric Violet</option>
                    <option value="cyber">Cyber Blue</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Golden Amber</option>
                    <option value="cyan">Neon Cyan</option>
                  </Select>
                </Field>

                <div style={{ alignSelf: "flex-end" }}>
                  <Button type="submit" variant="violet" size="sm">
                    Create Widget
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
                        <div className={styles.colorBadge} style={{ color: colorHex, background: colorHex }} />
                        <div>
                          <div className={styles.habitTitle}>{habit.title}</div>
                          <div className={styles.habitCategory}>{habit.category}</div>
                        </div>
                      </div>

                      <button
                        className={`${styles.checkBtn} ${isTodayDone ? styles.checkBtnCompleted : ""}`}
                        style={isTodayDone ? { background: colorHex, boxShadow: `0 0 14px ${colorHex}` } : {}}
                        onClick={() => handleToggleHabit(habit.id, today)}
                        aria-label="Toggle today check-in"
                      >
                        ✓
                      </button>
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
                  Log Metrics
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
                      </td>
                      {currentMonthDays.map((date) => {
                        const isDone = datesDone.has(date);
                        return (
                          <td key={date} style={{ padding: "0.2rem" }}>
                            <div
                              className={`${styles.gridDot} ${isDone ? styles.gridDotFilled : ""}`}
                              style={isDone ? { background: colorHex, boxShadow: `0 0 6px ${colorHex}` } : {}}
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

      {/* --- TAB 3: 75 HARD CHALLENGE --- */}
      {activeTab === "75hard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {loadingChallenge ? (
            <div style={{ color: "var(--text-faint)", padding: "2rem 0" }}>Loading 75 Hard status...</div>
          ) : (
            <div className={styles.hardCard}>
              <div className={styles.hardHeader}>
                <div>
                  <div className={styles.hardTitle}>75 Hard</div>
                  <div className={styles.hardSubtitle}>Tactical Discipline Challenge</div>
                </div>

                <div className={styles.hardBadgeBlock}>
                  <div className={styles.hardSectionTitle} style={{ margin: 0 }}>Current Attempt</div>
                  <div className={styles.hardDayNumber}>
                    {challenge?.status === "ACTIVE" ? `DAY ${challenge.currentDay}` : challenge?.status ?? "NOT STARTED"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#A38B70", marginTop: "0.15rem" }}>
                    Attempt #{challenge?.attemptCount ?? 1}
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              {(!challenge || challenge.status === "NOT_STARTED") && (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <p style={{ color: "#E6D2BC", marginBottom: "1.25rem" }}>
                    Are you ready to lock in for 75 consecutive days of uncompromising discipline?
                  </p>
                  <Button variant="emerald" onClick={() => handleChallengeAction("START")}>
                    Start 75 Hard Challenge
                  </Button>
                </div>
              )}

              {/* FAILED Modal Twist */}
              {challenge?.status === "FAILED" && (
                <div className={styles.failModalOverlay}>
                  <div className={styles.failModalCard}>
                    <div className={styles.failTitle}>CHALLENGE FAILED</div>
                    <div className={styles.failBody}>
                      You missed one or more required daily tasks on <strong>{challenge.failedDate ?? "yesterday"}</strong>.
                      <br /><br />
                      Per the 75 Hard rules: <em>Zero exceptions, zero cheat days.</em> Your streak has been reset to Day 1 for Attempt #{challenge.attemptCount + 1}.
                    </div>
                    <Button variant="danger" onClick={() => handleChallengeAction("RESTART")}>
                      Accept Twist & Restart Day 1
                    </Button>
                  </div>
                </div>
              )}

              {challenge?.status === "ACTIVE" && (
                <>
                  {/* Today Checklist */}
                  <div>
                    <div className={styles.hardSectionTitle}>Today&apos;s Core Rules Checklist</div>
                    <div className={styles.rulesChecklist}>
                      {RULES.map((rule) => {
                        const isChecked = Boolean(todayChallengeLog?.[rule.id]);
                        return (
                          <div
                            key={rule.id}
                            className={`${styles.ruleItem} ${isChecked ? styles.ruleItemChecked : ""}`}
                            onClick={() => handleToggleRule(rule.id)}
                          >
                            <div className={`${styles.ruleCheckbox} ${isChecked ? styles.ruleCheckboxChecked : ""}`}>
                              {isChecked ? "✓" : ""}
                            </div>
                            <span className={styles.ruleText}>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 75-Day Grid divided into 3 blocks of 25 */}
                  <div>
                    <div className={styles.hardSectionTitle}>75-Day Master Progress Grid</div>
                    <div className={styles.hardBlocksGrid}>
                      {[
                        { title: "DAYS 1 — 25", start: 1, end: 25 },
                        { title: "DAYS 26 — 50", start: 26, end: 50 },
                        { title: "DAYS 51 — 75", start: 51, end: 75 },
                      ].map((block) => (
                        <div className={styles.hardBlockRow} key={block.title}>
                          <div className={styles.hardBlockLabel}>{block.title}</div>
                          <div className={styles.hardDaysContainer}>
                            {Array.from({ length: block.end - block.start + 1 }, (_, i) => {
                              const dayNum = block.start + i;
                              const isDone = challengeLogs.some((l) => l.dayNumber === dayNum && l.allCompleted);
                              const isCurrent = challenge.currentDay === dayNum;

                              return (
                                <div
                                  key={dayNum}
                                  className={`${styles.hardDaySquare} ${isDone ? styles.hardDaySquareDone : ""} ${
                                    isCurrent ? styles.hardDaySquareCurrent : ""
                                  }`}
                                  title={`Day ${dayNum}: ${isDone ? "Completed" : isCurrent ? "Active Today" : "Upcoming"}`}
                                >
                                  {dayNum}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
