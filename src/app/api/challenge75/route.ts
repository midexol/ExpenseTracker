import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getUserLocalDateString } from "@/lib/gamification";
import { z } from "zod";

function getDaysDiff(startStr: string, endStr: string): number {
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const actionSchema = z.object({
  action: z.enum(["START", "RESTART", "ABORT"]),
  timezoneOffset: z.number().int().default(0),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tzOffset = parseInt(searchParams.get("tzOffset") ?? "0", 10);
  const today = getUserLocalDateString(tzOffset);

  let challenge = await prisma.challenge75.findUnique({
    where: { userId: user.id },
  });

  if (!challenge) {
    return NextResponse.json({ challenge: null, logs: [] });
  }

  let logs = await prisma.challenge75Log.findMany({
    where: { challengeId: challenge.id, attemptNumber: challenge.attemptCount },
    orderBy: { dayNumber: "asc" },
  });

  // Check auto-fail condition if active
  if (challenge.status === "ACTIVE" && challenge.startDate) {
    const totalDaysPassed = getDaysDiff(challenge.startDate, today);

    if (totalDaysPassed >= 75) {
      // Check if day 75 completed
      const day75Log = logs.find((l) => l.dayNumber === 75);
      if (day75Log && day75Log.allCompleted) {
        challenge = await prisma.challenge75.update({
          where: { id: challenge.id },
          data: { status: "COMPLETED", currentDay: 75 },
        });
      } else {
        challenge = await prisma.challenge75.update({
          where: { id: challenge.id },
          data: { status: "FAILED", failedDate: today },
        });
      }
    } else {
      // Check past days (startDate up to yesterday)
      const yesterday = addDays(today, -1);
      if (yesterday >= challenge.startDate) {
        // Find if any day prior to today was not completed
        let failedDateStr: string | null = null;
        let currDateStr = challenge.startDate;

        while (currDateStr <= yesterday) {
          const logForDay = logs.find((l) => l.date === currDateStr);
          if (!logForDay || !logForDay.allCompleted) {
            failedDateStr = currDateStr;
            break;
          }
          currDateStr = addDays(currDateStr, 1);
        }

        if (failedDateStr) {
          challenge = await prisma.challenge75.update({
            where: { id: challenge.id },
            data: { status: "FAILED", failedDate: failedDateStr },
          });
        } else {
          // Update currentDay counter
          const calculatedDay = totalDaysPassed + 1;
          if (calculatedDay !== challenge.currentDay) {
            challenge = await prisma.challenge75.update({
              where: { id: challenge.id },
              data: { currentDay: Math.min(75, calculatedDay) },
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ challenge, logs });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { action, timezoneOffset } = parsed.data;
  const today = getUserLocalDateString(timezoneOffset);

  const existing = await prisma.challenge75.findUnique({
    where: { userId: user.id },
  });

  let challenge;

  if (action === "START" || action === "RESTART") {
    const nextAttempt = existing ? existing.attemptCount + 1 : 1;
    challenge = await prisma.challenge75.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: "ACTIVE",
        startDate: today,
        currentDay: 1,
        attemptCount: 1,
      },
      update: {
        status: "ACTIVE",
        startDate: today,
        currentDay: 1,
        attemptCount: nextAttempt,
        failedDate: null,
      },
    });
  } else {
    // ABORT
    if (!existing) return NextResponse.json({ error: "No active challenge" }, { status: 400 });
    challenge = await prisma.challenge75.update({
      where: { userId: user.id },
      data: { status: "NOT_STARTED" },
    });
  }

  return NextResponse.json({ challenge });
}
