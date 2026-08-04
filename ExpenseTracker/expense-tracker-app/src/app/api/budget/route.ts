import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { budgetSchema } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budget = await prisma.budget.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ budget });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { amount, period, currency } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: { userId: user.id },
    update: { amount, period, currency },
    create: { userId: user.id, amount, period, currency },
  });

  return NextResponse.json({ budget });
}
