import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import { awardXp, registerActivityForStreak, checkAndUnlockAchievements } from "@/lib/gamification";

const toggleHabitSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean().optional(),
  timezoneOffset: z.number().int().default(0),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = toggleHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { habitId, date, completed: forcedCompleted, timezoneOffset } = parsed.data;

  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.userId !== user.id) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const existingLog = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });

  const targetCompleted = forcedCompleted !== undefined ? forcedCompleted : !existingLog?.completed;

  const result = await prisma.$transaction(async (tx) => {
    let streakInfo = null;

    if (targetCompleted && (!existingLog || !existingLog.completed)) {
      // Award 5 XP & 2 coins for completing a habit
      await awardXp(tx, user.id, 5, 2);
      streakInfo = await registerActivityForStreak(tx, user.id, timezoneOffset);
    }

    const log = await tx.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: {
        habitId,
        userId: user.id,
        date,
        completed: targetCompleted,
      },
      update: {
        completed: targetCompleted,
      },
    });

    const newlyUnlocked = await checkAndUnlockAchievements(tx, user.id);

    return { log, streakInfo, newlyUnlocked };
  });

  return NextResponse.json(result);
}
