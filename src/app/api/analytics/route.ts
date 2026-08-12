import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getUserLocalDateString } from "@/lib/gamification";

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tzOffset = parseInt(searchParams.get("tzOffset") ?? "0", 10);
  const todayStr = getUserLocalDateString(tzOffset);
  const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

  // 1. Fetch user profile and budget
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: { budget: true },
  });

  if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 2. Financial Analytics (Expenses)
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const cat = exp.category || "General";
    const existing = categoryMap.get(cat) || { total: 0, count: 0 };
    categoryMap.set(cat, {
      total: existing.total + exp.amount,
      count: existing.count + 1,
    });
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 3. Quests & Tasks (Todos)
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
  });

  const totalQuests = todos.length;
  const completedQuests = todos.filter((t) => t.completed).length;
  const questCompletionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  const byPriority = {
    High: { total: 0, completed: 0 },
    Med: { total: 0, completed: 0 },
    Low: { total: 0, completed: 0 },
  };

  for (const t of todos) {
    const prio = (t.priority as "High" | "Med" | "Low") || "Med";
    if (byPriority[prio]) {
      byPriority[prio].total += 1;
      if (t.completed) byPriority[prio].completed += 1;
    }
  }

  // 4. Habits Analytics
  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    include: { logs: true },
  });

  const totalHabits = habits.length;
  let totalHabitLogs = 0;
  const habitCategoryMap = new Map<string, number>();

  for (const h of habits) {
    const completedCount = h.logs.filter((l) => l.completed).length;
    totalHabitLogs += completedCount;

    const cat = h.category || "General";
    habitCategoryMap.set(cat, (habitCategoryMap.get(cat) || 0) + completedCount);
  }

  const habitCategories = Array.from(habitCategoryMap.entries()).map(([category, logsCount]) => ({
    category,
    logsCount,
  }));

  // 5. 75 Hard Analytics
  const challenge = await prisma.challenge75.findUnique({
    where: { userId: user.id },
    include: { logs: true },
  });

  const challengeStats = {
    status: challenge?.status ?? "NOT_STARTED",
    currentDay: challenge?.currentDay ?? 1,
    attemptCount: challenge?.attemptCount ?? 1,
    completedDays: challenge?.logs.filter((l) => l.allCompleted).length ?? 0,
  };

  // 6. Wellness & Daily Metrics
  const dailyMetrics = await prisma.dailyMetric.findMany({
    where: { userId: user.id },
    take: 30,
  });

  const validSleep = dailyMetrics.filter((m) => m.sleepHrs != null).map((m) => m.sleepHrs!);
  const validMood = dailyMetrics.filter((m) => m.mood != null).map((m) => m.mood!);
  const validStress = dailyMetrics.filter((m) => m.stress != null).map((m) => m.stress!);
  const validEnergy = dailyMetrics.filter((m) => m.energy != null).map((m) => m.energy!);

  const avgSleep = validSleep.length > 0 ? Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10 : null;
  const avgMood = validMood.length > 0 ? Math.round((validMood.reduce((a, b) => a + b, 0) / validMood.length) * 10) / 10 : null;
  const avgStress = validStress.length > 0 ? Math.round((validStress.reduce((a, b) => a + b, 0) / validStress.length) * 10) / 10 : null;
  const avgEnergy = validEnergy.length > 0 ? Math.round((validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length) * 10) / 10 : null;

  // 7. Activity Heatmap Grid (Past 365 Days)
  const activityMap = new Map<string, number>();

  // Count completed todos by date (completedAt or dueDate)
  for (const t of todos) {
    if (t.completed) {
      const dStr = t.completedAt ? t.completedAt.toISOString().slice(0, 10) : t.dueDate || todayStr;
      activityMap.set(dStr, (activityMap.get(dStr) || 0) + 1);
    }
  }

  // Count expenses by date
  for (const e of expenses) {
    activityMap.set(e.date, (activityMap.get(e.date) || 0) + 1);
  }

  // Count completed habit logs by date
  for (const h of habits) {
    for (const log of h.logs) {
      if (log.completed) {
        activityMap.set(log.date, (activityMap.get(log.date) || 0) + 1);
      }
    }
  }

  // Count 75 hard logs by date
  if (challenge) {
    for (const cLog of challenge.logs) {
      const completedDirectives = [cLog.diet, cLog.water, cLog.workouts, cLog.reading, cLog.photo].filter(Boolean).length;
      if (completedDirectives > 0) {
        activityMap.set(cLog.date, (activityMap.get(cLog.date) || 0) + completedDirectives);
      }
    }
  }

  // Generate 365 days array
  const activityGrid: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];
  const startDateStr = addDays(todayStr, -364);

  let currentCursor = startDateStr;
  while (currentCursor <= todayStr) {
    const count = activityMap.get(currentCursor) || 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0 && count <= 2) level = 1;
    else if (count >= 3 && count <= 5) level = 2;
    else if (count >= 6 && count <= 8) level = 3;
    else if (count >= 9) level = 4;

    activityGrid.push({ date: currentCursor, count, level });
    currentCursor = addDays(currentCursor, 1);
  }

  return NextResponse.json({
    user: {
      name: userRecord.name,
      xp: userRecord.xp,
      coins: userRecord.coins,
      currentStreak: userRecord.currentStreak,
      longestStreak: userRecord.longestStreak,
      createdAt: userRecord.createdAt,
    },
    financials: {
      totalSpent,
      monthSpent,
      budget: userRecord.budget,
      categories: categoryBreakdown,
    },
    quests: {
      total: totalQuests,
      completed: completedQuests,
      completionRate: questCompletionRate,
      byPriority,
    },
    habits: {
      totalHabits,
      totalLogs: totalHabitLogs,
      byCategory: habitCategories,
    },
    challenge75: challengeStats,
    wellness: {
      avgSleep,
      avgMood,
      avgStress,
      avgEnergy,
    },
    activityGrid,
  });
}
