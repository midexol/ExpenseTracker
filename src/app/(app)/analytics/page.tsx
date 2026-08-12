"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import styles from "./analytics.module.css";

interface AnalyticsData {
  user: {
    name: string;
    xp: number;
    coins: number;
    currentStreak: number;
    longestStreak: number;
    createdAt: string;
  };
  financials: {
    totalSpent: number;
    monthSpent: number;
    budget: { amount: number; period: string; currency: string } | null;
    categories: Array<{ category: string; total: number; percentage: number; count: number }>;
  };
  quests: {
    total: number;
    completed: number;
    completionRate: number;
    byPriority: {
      High: { total: number; completed: number };
      Med: { total: number; completed: number };
      Low: { total: number; completed: number };
    };
  };
  habits: {
    totalHabits: number;
    totalLogs: number;
    byCategory: Array<{ category: string; logsCount: number }>;
  };
  challenge75: {
    status: string;
    currentDay: number;
    attemptCount: number;
    completedDays: number;
  };
  wellness: {
    avgSleep: number | null;
    avgMood: number | null;
    avgStress: number | null;
    avgEnergy: number | null;
  };
  activityGrid: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#18adf2",
  Bills: "#ff4d4d",
  Shopping: "#a855f7",
  Health: "#22c55e",
  Entertainment: "#eab308",
  Travel: "#06b6d4",
  Education: "#ec4899",
  Work: "#3b82f6",
  Mind: "#a855f7",
  Fitness: "#ef4444",
  General: "#94a3b8",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const tz = clientTimezoneOffset();
      const res = await apiRequest<AnalyticsData>(`/api/analytics?tzOffset=${tz}`);
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className={styles.container}>
        <div style={{ color: "var(--text-dim)", padding: "3rem 0", textAlign: "center" }}>
          Aggregating user analytics & visual insights...
        </div>
      </div>
    );
  }

  const { user, financials, quests, habits, challenge75, wellness, activityGrid } = data;

  const budgetLimit = financials.budget?.amount ?? 0;
  const budgetPct = budgetLimit > 0 ? Math.min(100, Math.round((financials.monthSpent / budgetLimit) * 100)) : 0;
  const currency = financials.budget?.currency ?? "NGN";

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Command Analytics</h1>
          <p>Comprehensive visual breakdown of your discipline, finances, & habit velocity</p>
        </div>
        <div className={styles.headerBadge}>
          {activityGrid.filter((g) => g.count > 0).length} Active Days Tracked
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total XP Earned</div>
          <div className={styles.kpiValue}>{user.xp.toLocaleString()}</div>
          <div className={styles.kpiSubtext}>🏆 Paladin Discipline Score</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Current Streak</div>
          <div className={styles.kpiValue}>{user.currentStreak} Days</div>
          <div className={styles.kpiSubtext}>🔥 Longest: {user.longestStreak} Days</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Gold Spent</div>
          <div className={styles.kpiValue}>
            {currency} {financials.totalSpent.toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>💰 This Month: {currency} {financials.monthSpent.toLocaleString()}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Quests Completed</div>
          <div className={styles.kpiValue}>
            {quests.completed} / {quests.total}
          </div>
          <div className={styles.kpiSubtext}>🎯 {quests.completionRate}% Completion Rate</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Habit Ritual Check-ins</div>
          <div className={styles.kpiValue}>{habits.totalLogs}</div>
          <div className={styles.kpiSubtext}>⚡ {habits.totalHabits} Active Ritual Routines</div>
        </div>
      </div>

      {/* 365-Day Activity Heatmap */}
      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapHeader}>
          <h3 className={styles.heatmapTitle}>365-Day Activity Heatmap Grid</h3>
          <div className={styles.legendRow}>
            <span>Less</span>
            <div className={`${styles.cellSquare} ${styles.cellLevel0}`} />
            <div className={`${styles.cellSquare} ${styles.cellLevel1}`} />
            <div className={`${styles.cellSquare} ${styles.cellLevel2}`} />
            <div className={`${styles.cellSquare} ${styles.cellLevel3}`} />
            <div className={`${styles.cellSquare} ${styles.cellLevel4}`} />
            <span>More</span>
          </div>
        </div>

        <div className={styles.gridScroll}>
          <div className={styles.heatmapGrid365}>
            {activityGrid.map((item) => (
              <div
                key={item.date}
                className={`${styles.cellSquare} ${styles[`cellLevel${item.level}`]}`}
                title={`${item.date}: ${item.count} activity actions`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Sections */}
      <div className={styles.twoCol}>
        {/* Financial Category Distribution */}
        <Panel>
          <h3>Gold Vault Expense Breakdown</h3>
          {budgetLimit > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 800, color: "var(--text-dim)", marginBottom: "0.4rem" }}>
                <span>Monthly Budget Usage ({budgetPct}%)</span>
                <span>
                  {financials.monthSpent.toLocaleString()} / {budgetLimit.toLocaleString()} {currency}
                </span>
              </div>
              <ProgressBar pct={budgetPct} color={budgetPct > 90 ? "coral" : "emerald"} />
            </div>
          )}

          <div className={styles.breakdownList}>
            {financials.categories.length === 0 ? (
              <div style={{ color: "var(--text-dim)", fontSize: "0.88rem" }}>No expenses recorded yet.</div>
            ) : (
              financials.categories.map((cat) => {
                const color = CATEGORY_COLORS[cat.category] || "#18adf2";
                return (
                  <div key={cat.category} className={styles.breakdownItem}>
                    <div className={styles.breakdownHeader}>
                      <span>{cat.category} ({cat.count} txns)</span>
                      <span>
                        {currency} {cat.total.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className={styles.breakdownBarBg}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${cat.percentage}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        {/* Quest Priority Execution & Habits */}
        <Panel>
          <h3>Quest Priority & Habit Ritual Velocity</h3>

          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--text)" }}>
              Quest Priority Completion
            </div>
            <div className={styles.breakdownList}>
              {(["High", "Med", "Low"] as const).map((prio) => {
                const item = quests.byPriority[prio];
                const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                const prioColor = prio === "High" ? "var(--coral)" : prio === "Med" ? "var(--gold)" : "var(--highlight)";
                return (
                  <div key={prio} className={styles.breakdownItem}>
                    <div className={styles.breakdownHeader}>
                      <span>{prio} Priority Quests</span>
                      <span>
                        {item.completed} / {item.total} ({pct}%)
                      </span>
                    </div>
                    <div className={styles.breakdownBarBg}>
                      <div className={styles.breakdownBarFill} style={{ width: `${pct}%`, background: prioColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--text)" }}>
              Habits Category Completion
            </div>
            <div className={styles.breakdownList}>
              {habits.byCategory.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "0.88rem" }}>No habit logs recorded yet.</div>
              ) : (
                habits.byCategory.map((hc) => {
                  const color = CATEGORY_COLORS[hc.category] || "var(--highlight)";
                  const maxLogs = Math.max(1, ...habits.byCategory.map((c) => c.logsCount));
                  const pct = Math.round((hc.logsCount / maxLogs) * 100);
                  return (
                    <div key={hc.category} className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span>{hc.category} Habits</span>
                        <span>{hc.logsCount} Check-ins</span>
                      </div>
                      <div className={styles.breakdownBarBg}>
                        <div className={styles.breakdownBarFill} style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* 75 Hard & Daily Wellness Row */}
      <div className={styles.twoCol}>
        {/* 75 Hard Performance */}
        <Panel>
          <h3>75 Hard Crucible Discipline</h3>
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>Challenge Status</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  textTransform: uppercase(challenge75.status),
                  color: challenge75.status === "ACTIVE" ? "var(--emerald)" : challenge75.status === "FAILED" ? "var(--coral)" : "var(--text-dim)",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "var(--pill-radius)",
                  border: "1px solid var(--border-light)",
                }}
              >
                {challenge75.status}
              </span>
            </div>

            <div className={styles.breakdownItem}>
              <div className={styles.breakdownHeader}>
                <span>Current Progress (Day {challenge75.currentDay} / 75)</span>
                <span>{Math.round(((challenge75.currentDay - 1) / 75) * 100)}%</span>
              </div>
              <ProgressBar pct={Math.round(((challenge75.currentDay - 1) / 75) * 100)} color="gold" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-dim)" }}>
              <span>Total Attempts: <strong>#{challenge75.attemptCount}</strong></span>
              <span>Total Days Completed: <strong>{challenge75.completedDays} Days</strong></span>
            </div>
          </div>
        </Panel>

        {/* Daily Wellness Summary */}
        <Panel>
          <h3>Daily Wellness Metrics (30-Day Avg)</h3>
          <div className={styles.wellnessGrid}>
            <div className={styles.wellnessBox}>
              <div className={styles.wellnessVal}>{wellness.avgSleep != null ? `${wellness.avgSleep} hrs` : "N/A"}</div>
              <div className={styles.wellnessLbl}>Avg Sleep</div>
            </div>
            <div className={styles.wellnessBox}>
              <div className={styles.wellnessVal}>{wellness.avgMood != null ? `${wellness.avgMood} / 10` : "N/A"}</div>
              <div className={styles.wellnessLbl}>Avg Mood</div>
            </div>
            <div className={styles.wellnessBox}>
              <div className={styles.wellnessVal}>{wellness.avgEnergy != null ? `${wellness.avgEnergy} / 10` : "N/A"}</div>
              <div className={styles.wellnessLbl}>Avg Energy</div>
            </div>
            <div className={styles.wellnessBox}>
              <div className={styles.wellnessVal}>{wellness.avgStress != null ? `${wellness.avgStress} / 10` : "N/A"}</div>
              <div className={styles.wellnessLbl}>Avg Stress</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function uppercase(str: string): any {
  return str.toUpperCase();
}
