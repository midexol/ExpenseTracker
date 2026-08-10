import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { getUserLocalDateString } from "@/lib/gamification";

// Only nudge about unlogged spend after this local hour, so people aren't pinged at 7am.
const EXPENSE_REMINDER_HOUR = 18;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  const header = request.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || header === secret;
}

function localHour(timezoneOffsetMinutes: number, at = new Date()) {
  const localMs = at.getTime() - timezoneOffsetMinutes * 60_000;
  return new Date(localMs).getUTCHours();
}

export async function handleReminders(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
  });

  let todoReminders = 0;
  let expenseReminders = 0;
  let challengeReminders = 0;

  for (const user of users) {
    const today = getUserLocalDateString(user.timezoneOffset);

    if (user.lastTodoReminderDate !== today) {
      const dueCount = await prisma.todo.count({
        where: { userId: user.id, completed: false, dueDate: { lte: today } },
      });
      if (dueCount > 0) {
        await sendPushToUser(user.id, {
          title: `${dueCount} quest${dueCount === 1 ? "" : "s"} need${dueCount === 1 ? "s" : ""} you`,
          body: "Head back to Quest Log to knock them out and keep your streak alive.",
          url: "/todos",
        });
        await prisma.user.update({ where: { id: user.id }, data: { lastTodoReminderDate: today } });
        todoReminders++;
      }
    }

    if (user.lastExpenseReminderDate !== today && localHour(user.timezoneOffset) >= EXPENSE_REMINDER_HOUR) {
      const loggedToday = await prisma.expense.count({ where: { userId: user.id, date: today } });
      if (loggedToday === 0) {
        await sendPushToUser(user.id, {
          title: "Don't break your streak",
          body: "You haven't logged any spending today — takes 10 seconds.",
          url: "/expenses",
        });
        await prisma.user.update({ where: { id: user.id }, data: { lastExpenseReminderDate: today } });
        expenseReminders++;
      }
    }

    // 75 Hard Reminder: Notify after 19:00 if 75 Hard tasks are incomplete
    if (user.lastChallengeReminderDate !== today && localHour(user.timezoneOffset) >= 19) {
      const activeChallenge = await prisma.challenge75.findUnique({
        where: { userId: user.id },
      });
      if (activeChallenge && activeChallenge.status === "ACTIVE") {
        const todayLog = await prisma.challenge75Log.findUnique({
          where: { challengeId_date: { challengeId: activeChallenge.id, date: today } },
        });
        if (!todayLog || !todayLog.allCompleted) {
          await sendPushToUser(user.id, {
            title: "⚠️ 75 Hard Alert!",
            body: "Your 75 Hard tasks are incomplete today. Complete them before midnight or your streak resets to Day 1!",
            url: "/habits",
          });
          await prisma.user.update({ where: { id: user.id }, data: { lastChallengeReminderDate: today } });
          challengeReminders++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, usersChecked: users.length, todoReminders, expenseReminders, challengeReminders });
}

export async function GET(request: Request) {
  return handleReminders(request);
}

export async function POST(request: Request) {
  return handleReminders(request);
}
