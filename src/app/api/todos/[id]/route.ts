import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { todoUpdateSchema } from "@/lib/validation";
import {
  TODO_XP,
  TODO_COINS,
  awardXp,
  registerActivityForStreak,
  checkAndUnlockAchievements,
  getUserLocalDateString,
} from "@/lib/gamification";

type Params = { params: Promise<{ id: string }> };

function getNextDueDate(baseDueDate: string | null, recurrence: "DAILY" | "WEEKLY", timezoneOffset: number): string {
  const today = getUserLocalDateString(timezoneOffset);
  const start = baseDueDate && baseDueDate > today ? baseDueDate : today;
  const daysToAdd = recurrence === "DAILY" ? 1 : 7;
  const d = new Date(`${start}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = todoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { title, notes, dueDate, priority, recurrence, completed, timezoneOffset } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const finalPriority = priority ?? existing.priority;
    const finalRecurrence = recurrence ?? (existing as { recurrence?: string }).recurrence ?? "NONE";
    let completedAt = existing.completedAt;
    let streakInfo: Awaited<ReturnType<typeof registerActivityForStreak>> | null = null;
    const isFirstCompletion = completed === true && existing.completedAt === null;

    if (isFirstCompletion) {
      await awardXp(tx, user.id, TODO_XP[finalPriority] ?? TODO_XP.Med, TODO_COINS[finalPriority] ?? TODO_COINS.Med);
      streakInfo = await registerActivityForStreak(tx, user.id, timezoneOffset);
      completedAt = new Date();

      if (finalRecurrence === "DAILY" || finalRecurrence === "WEEKLY") {
        const nextDueDate = getNextDueDate(
          dueDate !== undefined ? dueDate : existing.dueDate,
          finalRecurrence,
          timezoneOffset
        );
        await tx.todo.create({
          data: {
            userId: user.id,
            title: title ?? existing.title,
            notes: notes !== undefined ? notes : existing.notes,
            dueDate: nextDueDate,
            priority: finalPriority,
            recurrence: finalRecurrence,
            xpValue: TODO_XP[finalPriority] ?? TODO_XP.Med,
          },
        });
      }
    }

    const todo = await tx.todo.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(priority !== undefined ? { priority, xpValue: TODO_XP[priority] ?? TODO_XP.Med } : {}),
        ...(recurrence !== undefined ? { recurrence } : {}),
        ...(completed !== undefined ? { completed } : {}),
        completedAt,
      },
    });

    const newlyUnlocked = await checkAndUnlockAchievements(tx, user.id);

    return { todo, streakInfo, newlyUnlocked };
  });

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
