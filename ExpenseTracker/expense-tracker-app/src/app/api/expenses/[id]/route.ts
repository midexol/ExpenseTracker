import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, category, amount, currency, date } = parsed.data;
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(date !== undefined ? { date } : {}),
    },
  });

  return NextResponse.json({ expense });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
