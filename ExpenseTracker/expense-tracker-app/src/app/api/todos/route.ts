import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { todoSchema } from "@/lib/validation";
import { TODO_XP } from "@/lib/gamification";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const completedParam = searchParams.get("completed");

  const todos = await prisma.todo.findMany({
    where: {
      userId: user.id,
      ...(completedParam !== null ? { completed: completedParam === "true" } : {}),
    },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = todoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { title, notes, dueDate, priority } = parsed.data;

  const todo = await prisma.todo.create({
    data: {
      userId: user.id,
      title,
      notes: notes ?? null,
      dueDate: dueDate ?? null,
      priority,
      xpValue: TODO_XP[priority] ?? TODO_XP.Med,
    },
  });

  return NextResponse.json({ todo }, { status: 201 });
}
