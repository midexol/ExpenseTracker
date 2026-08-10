import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const metricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHrs: z.number().min(0).max(24).optional().nullable(),
  mood: z.number().int().min(1).max(10).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = metricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { date, sleepHrs, mood, stress, energy } = parsed.data;

  const metric = await prisma.dailyMetric.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: {
      userId: user.id,
      date,
      sleepHrs,
      mood,
      stress,
      energy,
    },
    update: {
      ...(sleepHrs !== undefined ? { sleepHrs } : {}),
      ...(mood !== undefined ? { mood } : {}),
      ...(stress !== undefined ? { stress } : {}),
      ...(energy !== undefined ? { energy } : {}),
    },
  });

  return NextResponse.json({ metric });
}
