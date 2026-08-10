import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { awardXp, registerActivityForStreak, checkAndUnlockAchievements } from "@/lib/gamification";
import { z } from "zod";

const logRuleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rule: z.enum(["diet", "water", "workouts", "reading", "photo"]),
  completed: z.boolean().optional(),
  timezoneOffset: z.number().int().default(0),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = logRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { date, rule, completed: forcedVal, timezoneOffset } = parsed.data;

  const challenge = await prisma.challenge75.findUnique({
    where: { userId: user.id },
  });

  if (!challenge || challenge.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active 75 Hard challenge" }, { status: 400 });
  }

  const existingLog = await prisma.challenge75Log.findUnique({
    where: { challengeId_date: { challengeId: challenge.id, date } },
  });

  const nextRuleVal = forcedVal !== undefined ? forcedVal : !existingLog?.[rule];

  const currentDiet = rule === "diet" ? nextRuleVal : (existingLog?.diet ?? false);
  const currentWater = rule === "water" ? nextRuleVal : (existingLog?.water ?? false);
  const currentWorkouts = rule === "workouts" ? nextRuleVal : (existingLog?.workouts ?? false);
  const currentReading = rule === "reading" ? nextRuleVal : (existingLog?.reading ?? false);
  const currentPhoto = rule === "photo" ? nextRuleVal : (existingLog?.photo ?? false);

  const allCompleted = currentDiet && currentWater && currentWorkouts && currentReading && currentPhoto;
  const wasAllCompletedBefore = existingLog?.allCompleted ?? false;

  const result = await prisma.$transaction(async (tx) => {
    let streakInfo = null;

    // Bonus XP if user completes all 5 rules for today!
    if (allCompleted && !wasAllCompletedBefore) {
      await awardXp(tx, user.id, 25, 10);
      streakInfo = await registerActivityForStreak(tx, user.id, timezoneOffset);
    }

    const log = await tx.challenge75Log.upsert({
      where: { challengeId_date: { challengeId: challenge.id, date } },
      create: {
        challengeId: challenge.id,
        userId: user.id,
        date,
        dayNumber: challenge.currentDay,
        attemptNumber: challenge.attemptCount,
        diet: currentDiet,
        water: currentWater,
        workouts: currentWorkouts,
        reading: currentReading,
        photo: currentPhoto,
        allCompleted,
      },
      update: {
        diet: currentDiet,
        water: currentWater,
        workouts: currentWorkouts,
        reading: currentReading,
        photo: currentPhoto,
        allCompleted,
      },
    });

    const newlyUnlocked = await checkAndUnlockAchievements(tx, user.id);

    return { log, streakInfo, newlyUnlocked };
  });

  return NextResponse.json(result);
}
