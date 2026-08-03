"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  xp: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
}

export interface UnlockedAchievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
}

interface AppDataValue {
  me: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  notifyUnlocks: (achievements: UnlockedAchievement[]) => void;
  toasts: UnlockedAchievement[];
  dismissToast: (id: string) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<UnlockedAchievement[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.ok) {
      setMe(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const notifyUnlocks = useCallback((achievements: UnlockedAchievement[]) => {
    if (!achievements?.length) return;
    setToasts((prev) => [...prev, ...achievements]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ me, loading, refresh, notifyUnlocks, toasts, dismissToast }),
    [me, loading, refresh, notifyUnlocks, toasts, dismissToast]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
