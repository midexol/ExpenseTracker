import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const updateHabitSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
  category: z.string().trim().optional(),
  color: z.enum(["coral", "violet", "cyber", "emerald", "amber", "cyan"]).optional(),
  archived: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.habit.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const updated = await prisma.habit.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ habit: updated });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.habit.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  await prisma.habit.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
