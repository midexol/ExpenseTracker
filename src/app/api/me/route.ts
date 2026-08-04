import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { levelProgress } from "@/lib/gamification";

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
