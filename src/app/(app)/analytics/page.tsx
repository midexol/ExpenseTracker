"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import styles from "./analytics.module.css";

interface RadarAttribute {
  label: string;
  value: number;
}

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
  radarAttributes: RadarAttribute[];
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

function RadarChart({ attributes }: { attributes: RadarAttribute[] }) {
  const cx = 150;
  const cy = 145;
  const radius = 85;
  const count = attributes.length;

  const polygonPoints = attributes
    .map((attr, i) => {
      const angle = (i * (360 / count) - 90) * (Math.PI / 180);
      const r = radius * (Math.min(100, Math.max(0, attr.value)) / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={styles.radarBox}>
      <svg width="320" height="290" viewBox="0 0 300 290">
        {[0.25, 0.5, 0.75, 1].map((scale) => {
          const webPoints = attributes
            .map((_, i) => {
              const angle = (i * (360 / count) - 90) * (Math.PI / 180);
              const x = cx + radius * scale * Math.cos(angle);
              const y = cy + radius * scale * Math.sin(angle);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={scale}
              points={webPoints}
              fill="none"
              stroke="var(--border-light)"
              strokeWidth="1"
              strokeDasharray={scale === 1 ? "none" : "3,3"}
            />
          );
        })}

        {attributes.map((_, i) => {
          const angle = (i * (360 / count) - 90) * (Math.PI / 180);
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-light)" strokeWidth="1" />;
        })}

        <polygon points={polygonPoints} fill="rgba(24, 173, 242, 0.22)" stroke="var(--highlight)" strokeWidth="2.5" />

        {attributes.map((attr, i) => {
          const angle = (i * (360 / count) - 90) * (Math.PI / 180);
          const rData = radius * (Math.min(100, Math.max(0, attr.value)) / 100);
          const dotX = cx + rData * Math.cos(angle);
          const dotY = cy + rData * Math.sin(angle);

          const labelR = radius + 22;
          const labelX = cx + labelR * Math.cos(angle);
          const labelY = cy + labelR * Math.sin(angle);

          let textAnchor = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          else if (Math.cos(angle) < -0.3) textAnchor = "end";

          return (
            <g key={attr.label}>
              <circle cx={dotX} cy={dotY} r="4" fill="var(--highlight)" />
              <text x={labelX} y={labelY + 4} textAnchor={textAnchor} fontSize="11" fontWeight="800" fill="var(--text)">
                {attr.label} ({attr.value}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
          Loading performance analytics...
        </div>
      </div>
    );
  }

  const { user, financials, quests, habits, challenge75, radarAttributes, activityGrid } = data;

  const budgetLimit = financials.budget?.amount ?? 0;
  const budgetPct = budgetLimit > 0 ? Math.min(100, Math.round((financials.monthSpent / budgetLimit) * 100)) : 0;
  const currency = financials.budget?.currency ?? "NGN";

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Performance Analytics</h1>
          <p>Visual overview of overall activity, financial control, and habit velocity</p>
        </div>
        <div className={styles.headerBadge}>
          {activityGrid.filter((g) => g.count > 0).length} Active Days
        </div>
      </div>

      {/* Overview KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total XP</div>
          <div className={styles.kpiValue}>{user.xp.toLocaleString()}</div>
          <div className={styles.kpiSubtext}>Discipline Rank Score</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Streak</div>
          <div className={styles.kpiValue}>{user.currentStreak} Days</div>
          <div className={styles.kpiSubtext}>Best: {user.longestStreak} Days</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Gold Spent</div>
          <div className={styles.kpiValue}>
            {currency} {financials.totalSpent.toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>This Month: {currency} {financials.monthSpent.toLocaleString()}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Quests Completed</div>
          <div className={styles.kpiValue}>
            {quests.completed} / {quests.total}
          </div>
          <div className={styles.kpiSubtext}>{quests.completionRate}% Completion Rate</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Habit Check-ins</div>
          <div className={styles.kpiValue}>{habits.totalLogs}</div>
          <div className={styles.kpiSubtext}>{habits.totalHabits} Active Habits</div>
        </div>
      </div>

      {/* 365-Day Activity Heatmap */}
      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapHeader}>
          <h3 className={styles.heatmapTitle}>365-Day Activity Grid</h3>
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

      {/* Radar Attributes Visualization & 75 Hard */}
      <div className={styles.twoCol}>
        <Panel>
          <h3>Performance Attributes Radar</h3>
          <RadarChart attributes={radarAttributes} />
        </Panel>

        <Panel>
          <h3>75 Hard Challenge</h3>
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>Challenge Status</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color:
                    challenge75.status === "ACTIVE"
                      ? "var(--emerald)"
                      : challenge75.status === "FAILED"
                      ? "var(--coral)"
                      : "var(--text-dim)",
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
                <span>Current Streak (Day {challenge75.currentDay} / 75)</span>
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
      </div>

      {/* Financials & Quests Row */}
      <div className={styles.twoCol}>
        {/* Financial Category Distribution */}
        <Panel>
          <h3>Expense Category Distribution</h3>
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
                      <div className={styles.breakdownBarFill} style={{ width: `${cat.percentage}%`, background: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        {/* Quest Priority Execution */}
        <Panel>
          <h3>Quest Priority Execution</h3>
          <div className={styles.breakdownList} style={{ marginTop: "1rem" }}>
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
        </Panel>
      </div>
    </div>
  );
}
