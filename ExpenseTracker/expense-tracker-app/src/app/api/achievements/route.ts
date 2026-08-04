import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [achievements, unlocks] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
  ]);

  const unlockedMap = new Map(unlocks.map((u) => [u.achievementId, u.unlockedAt]));

  return NextResponse.json({
    achievements: achievements.map((a) => ({
      ...a,
      unlockedAt: unlockedMap.get(a.id) ?? null,
    })),
  });
}
