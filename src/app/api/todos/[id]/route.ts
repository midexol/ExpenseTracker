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
} from "@/lib/gamification";

type Params = { params: Promise<{ id: string }> };

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
  const { title, notes, dueDate, priority, completed, timezoneOffset } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const finalPriority = priority ?? existing.priority;
    let completedAt = existing.completedAt;
    let streakInfo: Awaited<ReturnType<typeof registerActivityForStreak>> | null = null;
    const isFirstCompletion = completed === true && existing.completedAt === null;

    if (isFirstCompletion) {
      await awardXp(tx, user.id, TODO_XP[finalPriority] ?? TODO_XP.Med, TODO_COINS[finalPriority] ?? TODO_COINS.Med);
      streakInfo = await registerActivityForStreak(tx, user.id, timezoneOffset);
      completedAt = new Date();
    }

    const todo = await tx.todo.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(priority !== undefined ? { priority, xpValue: TODO_XP[priority] ?? TODO_XP.Med } : {}),
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
