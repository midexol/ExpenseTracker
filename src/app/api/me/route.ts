import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { levelProgress } from "@/lib/gamification";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progress = levelProgress(user.xp);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    coins: user.coins,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    ...progress,
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email } = parsed.data;

  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    },
  });

  const progress = levelProgress(updated.xp);

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    xp: updated.xp,
    coins: updated.coins,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    ...progress,
  });
}
