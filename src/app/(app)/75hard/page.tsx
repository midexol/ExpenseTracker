"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { todayLocalString } from "@/lib/constants";
import type { GamificationResult } from "@/lib/types";
import styles from "./75hard.module.css";

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

const DIRECTIVES = [
  { id: "workouts", title: "Workout 1 (Outdoor)", sub: "45 Minutes Minimum" },
  { id: "workouts2", title: "Workout 2", sub: "45 Minutes (Any)" },
  { id: "water", title: "Hydration", sub: "1 Gallon Pure Water" },
  { id: "reading", title: "Read 10 Pages", sub: "Non-Fiction / Educational" },
  { id: "diet", title: "Clean Diet", sub: "No Cheat Meals, No Alcohol" },
  { id: "photo", title: "Progress Photo", sub: "Daily Visual Log" },
] as const;

export default function Challenge75Page() {
  const { refresh, notifyUnlocks } = useAppData();
  const [challenge, setChallenge] = useState<Challenge75 | null>(null);
  const [logs, setLogs] = useState<Challenge75Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedModal, setDismissedModal] = useState(false);

  const today = todayLocalString();

  async function loadData() {
    setLoading(true);
    const tz = clientTimezoneOffset();
    const data = await apiRequest<{ challenge: Challenge75 | null; logs: Challenge75Log[] }>(`/api/challenge75?tzOffset=${tz}`);
    setChallenge(data.challenge);
    setLogs(data.logs);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && challenge?.status === "FAILED" && !dismissedModal) {
        setDismissedModal(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [challenge?.status, dismissedModal]);

  async function handleAction(action: "START" | "RESTART" | "ABORT") {
    await apiRequest("/api/challenge75", {
      method: "POST",
      body: JSON.stringify({ action, timezoneOffset: clientTimezoneOffset() }),
    });
    setDismissedModal(false);
    await loadData();
  }

  async function handleToggleRule(ruleKey: string) {
    // map directive IDs to schema rules
    const mappedRule = ruleKey === "workouts2" ? "workouts" : ruleKey;
    const result = await apiRequest<GamificationResult>("/api/challenge75/log", {
      method: "POST",
      body: JSON.stringify({ date: today, rule: mappedRule, timezoneOffset: clientTimezoneOffset() }),
    });
    notifyUnlocks(result.newlyUnlocked);
    await Promise.all([loadData(), refresh()]);
  }

  const todayLog = useMemo(() => logs.find((l) => l.date === today), [logs, today]);

  const currentDay = challenge?.currentDay ?? 1;
  const progressPct = Math.min(100, Math.round(((currentDay - 1) / 75) * 100));
  const remainingDays = Math.max(0, 75 - currentDay + 1);

  // Analytics Stats
  const completedDaysCount = useMemo(() => logs.filter((l) => l.allCompleted).length, [logs]);
  const consistencyPct = Math.round((completedDaysCount / Math.max(1, currentDay)) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1>75 Hard Journey</h1>
          <p>Tactical discipline challenge & comprehensive analytics</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-dim)", padding: "2rem 0" }}>Loading 75 Hard status...</div>
      ) : (
        <>
          {/* Main Hero Challenge Banner */}
          <div className={styles.heroCard}>
            <div className={styles.questlineBanner}>ACTIVE QUESTLINE: THE CRUCIBLE</div>

            <div className={styles.dayTitleRow}>
              <div className={styles.dayTitle}>
                DAY {challenge?.status === "ACTIVE" ? challenge.currentDay : 1} <span>/ 75</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <div className={styles.attemptBadge}>Attempt #{challenge?.attemptCount ?? 1}</div>
                {challenge?.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this 75 Hard attempt?")) {
                        handleAction("ABORT");
                      }
                    }}
                    style={{ color: "var(--coral)", border: "1px solid rgba(255, 77, 77, 0.3)" }}
                  >
                    Cancel Challenge
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.subtext}>
              Maintain absolute discipline. Any failure resets progress to Day 1. There are no respawns here.
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressTextRow}>
                <span>Progress: {progressPct}%</span>
                <span>Remaining: {remainingDays} Days</span>
              </div>
              <ProgressBar pct={progressPct} color="gold" segments={15} />
            </div>
          </div>

          {/* Start / Fail / Active Controls */}
          {(!challenge || challenge.status === "NOT_STARTED") && (
            <Panel>
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <h3 style={{ marginBottom: "0.5rem" }}>Begin The 75 Hard Challenge</h3>
                <p style={{ color: "var(--text-dim)", marginBottom: "1.25rem" }}>
                  75 consecutive days. 6 daily directives. Zero cheat days.
                </p>
                <Button variant="emerald" onClick={() => handleAction("START")}>
                  Start 75 Hard Challenge ↗
                </Button>
              </div>
            </Panel>
          )}

          {challenge?.status === "FAILED" && (
            <>
              {!dismissedModal && (
                <div
                  className={styles.failModalOverlay}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setDismissedModal(true);
                    }
                  }}
                >
                  <div className={styles.failModalCard}>
                    <button
                      type="button"
                      className={styles.closeBtn}
                      onClick={() => setDismissedModal(true)}
                      aria-label="Close modal"
                      title="Close"
                    >
                      ✕
                    </button>
                    <div className={styles.failTitle}>CHALLENGE FAILED</div>
                    <div className={styles.failBody}>
                      You missed one or more required daily tasks on <strong>{challenge.failedDate ?? "yesterday"}</strong>.
                      <br /><br />
                      Per the 75 Hard rules: <em>Zero exceptions, zero cheat days.</em> Your streak has been reset to Day 1 for Attempt #{challenge.attemptCount + 1}.
                    </div>
                    <div className={styles.modalActionRow}>
                      <Button variant="danger" onClick={() => handleAction("RESTART")}>
                        Accept Twist & Restart Day 1 ↗
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this challenge?")) {
                            handleAction("ABORT");
                          }
                        }}
                        style={{ color: "var(--coral)" }}
                      >
                        Cancel Challenge
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Panel>
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <h3 style={{ color: "var(--coral)", marginBottom: "0.5rem" }}>Challenge Failed</h3>
                  <p style={{ color: "var(--text-dim)", marginBottom: "1.25rem" }}>
                    You missed required daily tasks on <strong>{challenge.failedDate ?? "yesterday"}</strong>. Ready for Attempt #{challenge.attemptCount + 1}?
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <Button variant="danger" onClick={() => handleAction("RESTART")}>
                      Accept Twist & Restart Day 1 ↗
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this challenge?")) {
                          handleAction("ABORT");
                        }
                      }}
                      style={{ color: "var(--coral)" }}
                    >
                      Cancel Challenge
                    </Button>
                    {dismissedModal && (
                      <Button variant="ghost" onClick={() => setDismissedModal(false)}>
                        View Failure Details
                      </Button>
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}

          {/* Daily Directives Checklist */}
          {challenge?.status === "ACTIVE" && (
            <div>
              <h3 style={{ marginBottom: "1rem" }}>Daily Directives</h3>
              <div className={styles.directivesGrid}>
                {DIRECTIVES.map((dir) => {
                  const ruleKey = dir.id === "workouts2" ? "workouts" : dir.id;
                  const isChecked = Boolean(todayLog?.[ruleKey as keyof Challenge75Log]);
                  return (
                    <div
                      key={dir.id}
                      className={`${styles.directiveCard} ${isChecked ? styles.directiveCardChecked : ""}`}
                      onClick={() => handleToggleRule(dir.id)}
                    >
                      <div className={styles.directiveInfo}>
                        <div className={styles.directiveTitle}>{dir.title}</div>
                        <div className={styles.directiveSub}>{dir.sub}</div>
                      </div>
                      <div className={`${styles.checkCircle} ${isChecked ? styles.checkCircleChecked : ""}`}>
                        {isChecked ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- 75 HARD ANALYTICS SECTION --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
            <h2>75 Hard Analytics & Master Grid</h2>

            <div className={styles.analyticsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statVal}>{completedDaysCount}</div>
                <div className={styles.statLbl}>Days Completed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statVal}>{consistencyPct}%</div>
                <div className={styles.statLbl}>Discipline Rate</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statVal}>#{challenge?.attemptCount ?? 1}</div>
                <div className={styles.statLbl}>Current Attempt</div>
              </div>
            </div>

            {/* 75-Day Master Grid */}
            <Panel>
              <h3>75-Day Master Progress Grid</h3>
              <div className={styles.masterGrid} style={{ marginTop: "1rem" }}>
                {[
                  { title: "DAYS 1 — 25", start: 1, end: 25 },
                  { title: "DAYS 26 — 50", start: 26, end: 50 },
                  { title: "DAYS 51 — 75", start: 51, end: 75 },
                ].map((block) => (
                  <div className={styles.masterRow} key={block.title}>
                    <div className={styles.masterRowLabel}>{block.title}</div>
                    <div className={styles.daysContainer}>
                      {Array.from({ length: block.end - block.start + 1 }, (_, i) => {
                        const dayNum = block.start + i;
                        const isDone = logs.some((l) => l.dayNumber === dayNum && l.allCompleted);
                        const isCurrent = challenge?.currentDay === dayNum;

                        return (
                          <div
                            key={dayNum}
                            className={`${styles.daySquare} ${isDone ? styles.daySquareDone : ""} ${
                              isCurrent ? styles.daySquareCurrent : ""
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
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
