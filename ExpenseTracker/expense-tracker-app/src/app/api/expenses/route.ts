import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import {
  EXPENSE_LOG_XP,
  EXPENSE_LOG_COINS,
  awardXp,
  getUserLocalDateString,
  registerActivityForStreak,
  checkAndUnlockAchievements,
} from "@/lib/gamification";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      ...(category ? { category } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, category, amount, currency, date, timezoneOffset } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const today = getUserLocalDateString(timezoneOffset);
    let loggedFirstToday = false;
    let streakInfo: Awaited<ReturnType<typeof registerActivityForStreak>> | null = null;

    if (date === today) {
      const countToday = await tx.expense.count({ where: { userId: user.id, date: today } });
      loggedFirstToday = countToday === 0;
    }

    const expense = await tx.expense.create({
      data: { userId: user.id, name, category, amount, currency, date },
    });

    if (loggedFirstToday) {
      await awardXp(tx, user.id, EXPENSE_LOG_XP, EXPENSE_LOG_COINS);
      streakInfo = await registerActivityForStreak(tx, user.id, timezoneOffset);
    }

    const newlyUnlocked = await checkAndUnlockAchievements(tx, user.id);

    return { expense, streakInfo, newlyUnlocked };
  });

  return NextResponse.json(result, { status: 201 });
}
