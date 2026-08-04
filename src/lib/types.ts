export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  period: "Weekly" | "Monthly";
  currency: string;
}

export interface Todo {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: "Low" | "Med" | "High";
  completed: boolean;
  completedAt: string | null;
  xpValue: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  sortOrder: number;
  unlockedAt: string | null;
}

export interface GamificationResult {
  streakInfo: { changed: boolean; currentStreak: number; bonus: { xp: number; coins: number } | null } | null;
  newlyUnlocked: Achievement[];
}
