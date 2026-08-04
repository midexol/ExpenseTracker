import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// --- Leveling curve ---
// Cumulative XP required to *reach* a given level. Level 1 starts at 0 XP.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.4));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const into = xp - floor;
  return {
    level,
    xpIntoLevel: into,
    xpForNextLevel: span,
    progressPct: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 100,
  };
}

// --- XP / coin values ---
export const TODO_XP: Record<string, number> = { Low: 8, Med: 10, High: 15 };
export const TODO_COINS: Record<string, number> = { Low: 3, Med: 4, High: 6 };
export const EXPENSE_LOG_XP = 5;
export const EXPENSE_LOG_COINS = 2;
export const STREAK_DAY_XP = 2;
export const STREAK_DAY_COINS = 1;
export const STREAK_MILESTONE_BONUS: Record<number, { xp: number; coins: number }> = {
  3: { xp: 15, coins: 10 },
  7: { xp: 30, coins: 20 },
  30: { xp: 150, coins: 100 },
  100: { xp: 500, coins: 300 },
};

export async function awardXp(
  tx: TxClient,
  userId: string,
  xpDelta: number,
  coinDelta: number
) {
  return tx.user.update({
    where: { id: userId },
    data: { xp: { increment: xpDelta }, coins: { increment: coinDelta } },
  });
}

// --- Streaks ---
// Uses the offset captured from the browser (JS Date.getTimezoneOffset() convention:
// minutes to ADD to local time to get UTC) so "today" lines up with the user's day.
export function getUserLocalDateString(timezoneOffsetMinutes: number, at = new Date()) {
  const localMs = at.getTime() - timezoneOffsetMinutes * 60_000;
  return new Date(localMs).toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function registerActivityForStreak(
  tx: TxClient,
  userId: string,
  timezoneOffsetMinutes: number
) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  const today = getUserLocalDateString(timezoneOffsetMinutes);

  if (user.lastActiveDate === today) {
    return { changed: false, currentStreak: user.currentStreak, bonus: null as null | { xp: number; coins: number } };
  }

  const wasYesterday = user.lastActiveDate === addDays(today, -1);
  const currentStreak = wasYesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(user.longestStreak, currentStreak);
  const bonus = STREAK_MILESTONE_BONUS[currentStreak] ?? null;

  await tx.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      xp: { increment: STREAK_DAY_XP + (bonus?.xp ?? 0) },
      coins: { increment: STREAK_DAY_COINS + (bonus?.coins ?? 0) },
    },
  });

  return { changed: true, currentStreak, bonus };
}

// --- Achievements ---
export interface AchievementStats {
  xp: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  todosCompletedCount: number;
  expensesLoggedCount: number;
  underBudgetThisPeriod: boolean;
}

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: "sword" | "trophy" | "flame" | "coin" | "star" | "chest";
  xpReward: number;
  coinReward: number;
  sortOrder: number;
  check: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: "first_quest", name: "First Quest", description: "Complete your first quest.", icon: "sword", xpReward: 10, coinReward: 5, sortOrder: 1, check: (s) => s.todosCompletedCount >= 1 },
  { key: "quest_apprentice", name: "Quest Apprentice", description: "Complete 10 quests.", icon: "sword", xpReward: 20, coinReward: 10, sortOrder: 2, check: (s) => s.todosCompletedCount >= 10 },
  { key: "quest_master", name: "Quest Master", description: "Complete 50 quests.", icon: "trophy", xpReward: 50, coinReward: 25, sortOrder: 3, check: (s) => s.todosCompletedCount >= 50 },
  { key: "quest_legend", name: "Quest Legend", description: "Complete 100 quests.", icon: "trophy", xpReward: 100, coinReward: 50, sortOrder: 4, check: (s) => s.todosCompletedCount >= 100 },
  { key: "first_ledger", name: "First Ledger Entry", description: "Log your first expense.", icon: "coin", xpReward: 10, coinReward: 5, sortOrder: 5, check: (s) => s.expensesLoggedCount >= 1 },
  { key: "tracker_10", name: "Diligent Tracker", description: "Log 10 expenses.", icon: "coin", xpReward: 20, coinReward: 10, sortOrder: 6, check: (s) => s.expensesLoggedCount >= 10 },
  { key: "tracker_50", name: "Ledger Keeper", description: "Log 50 expenses.", icon: "coin", xpReward: 50, coinReward: 25, sortOrder: 7, check: (s) => s.expensesLoggedCount >= 50 },
  { key: "streak_3", name: "Warming Up", description: "Reach a 3-day streak.", icon: "flame", xpReward: 15, coinReward: 10, sortOrder: 8, check: (s) => s.longestStreak >= 3 },
  { key: "streak_7", name: "On Fire", description: "Reach a 7-day streak.", icon: "flame", xpReward: 30, coinReward: 20, sortOrder: 9, check: (s) => s.longestStreak >= 7 },
  { key: "streak_30", name: "Unstoppable", description: "Reach a 30-day streak.", icon: "flame", xpReward: 150, coinReward: 100, sortOrder: 10, check: (s) => s.longestStreak >= 30 },
  { key: "streak_100", name: "Legendary Streak", description: "Reach a 100-day streak.", icon: "flame", xpReward: 500, coinReward: 300, sortOrder: 11, check: (s) => s.longestStreak >= 100 },
  { key: "level_5", name: "Rising Adventurer", description: "Reach level 5.", icon: "star", xpReward: 0, coinReward: 20, sortOrder: 12, check: (s) => levelFromXp(s.xp) >= 5 },
  { key: "level_10", name: "Seasoned Adventurer", description: "Reach level 10.", icon: "star", xpReward: 0, coinReward: 50, sortOrder: 13, check: (s) => levelFromXp(s.xp) >= 10 },
  { key: "level_25", name: "Champion", description: "Reach level 25.", icon: "star", xpReward: 0, coinReward: 150, sortOrder: 14, check: (s) => levelFromXp(s.xp) >= 25 },
  { key: "budget_boss", name: "Budget Boss", description: "Stay under budget for the current period.", icon: "chest", xpReward: 40, coinReward: 30, sortOrder: 15, check: (s) => s.underBudgetThisPeriod },
];

export function periodStartDate(period: string): string {
  const now = new Date();
  if (period === "Weekly") {
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // Monday as start of week
    now.setUTCDate(now.getUTCDate() - diff);
  } else {
    now.setUTCDate(1);
  }
  return now.toISOString().slice(0, 10);
}

export async function checkAndUnlockAchievements(tx: TxClient, userId: string) {
  const [user, todosCompletedCount, expensesLoggedCount, budget, unlockedRows, allAchievements] =
    await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: userId } }),
      tx.todo.count({ where: { userId, completed: true } }),
      tx.expense.count({ where: { userId } }),
      tx.budget.findUnique({ where: { userId } }),
      tx.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { key: true } } } }),
      tx.achievement.findMany(),
    ]);

  let underBudgetThisPeriod = false;
  if (budget && budget.amount > 0) {
    const start = periodStartDate(budget.period);
    const spent = await tx.expense.aggregate({
      where: { userId, date: { gte: start } },
      _sum: { amount: true },
    });
    underBudgetThisPeriod = (spent._sum.amount ?? 0) <= budget.amount;
  }

  const stats: AchievementStats = {
    xp: user.xp,
    coins: user.coins,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    todosCompletedCount,
    expensesLoggedCount,
    underBudgetThisPeriod,
  };

  const unlockedKeys = new Set(unlockedRows.map((r) => r.achievement.key));
  const newlyUnlocked: (typeof allAchievements)[number][] = [];

  for (const achievement of allAchievements) {
    if (unlockedKeys.has(achievement.key)) continue;
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === achievement.key);
    if (!def || !def.check(stats)) continue;

    await tx.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
    if (achievement.xpReward || achievement.coinReward) {
      await awardXp(tx, userId, achievement.xpReward, achievement.coinReward);
    }
    newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

export type { Prisma };
