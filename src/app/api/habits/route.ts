import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const createHabitSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60),
  category: z.string().trim().default("General"),
  color: z.enum(["coral", "violet", "cyber", "emerald", "amber", "cyan"]).default("coral"),
});

const DEFAULT_HABITS = [
  { title: "Read 20 pages", category: "Mind", color: "violet" },
  { title: "Workout 45 mins", category: "Fitness", color: "emerald" },
  { title: "Drink 2L Water", category: "Health", color: "cyan" },
  { title: "Deep Work Session", category: "Work", color: "cyber" },
];

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // e.g. "2026-08"

  let habits = await prisma.habit.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "asc" },
  });

  // Seed default habits if user has none
  if (habits.length === 0) {
    await prisma.habit.createMany({
      data: DEFAULT_HABITS.map((h) => ({
        userId: user.id,
        title: h.title,
        category: h.category,
        color: h.color,
      })),
    });
    habits = await prisma.habit.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
    });
  }

  // Get habit logs for month or all
  const habitLogs = await prisma.habitLog.findMany({
    where: {
      userId: user.id,
      ...(month ? { date: { startsWith: month } } : {}),
    },
  });

  // Get daily metrics for month or all
  const dailyMetrics = await prisma.dailyMetric.findMany({
    where: {
      userId: user.id,
      ...(month ? { date: { startsWith: month } } : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ habits, habitLogs, dailyMetrics });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      color: parsed.data.color,
    },
  });

  return NextResponse.json({ habit }, { status: 201 });
}
