"use client";

import { useEffect } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACHIEVEMENT_ICONS, type AchievementIconKey } from "@/components/icons/GameIcons";
import styles from "./AchievementToast.module.css";

function Toast({
  id,
  name,
  icon,
  xpReward,
  coinReward,
  onDismiss,
}: {
  id: string;
  name: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const Icon = ACHIEVEMENT_ICONS[icon as AchievementIconKey] ?? ACHIEVEMENT_ICONS.trophy;

  return (
    <div className={styles.toast}>
      <div className={styles.icon}>
        <Icon width={20} height={20} />
      </div>
      <div className={styles.body}>
        <div className={styles.eyebrow}>Achievement unlocked</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.rewards}>
          +{xpReward} XP{coinReward ? ` · +${coinReward} coins` : ""}
        </div>
      </div>
      <button className={styles.close} onClick={() => onDismiss(id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export function AchievementToastStack() {
  const { toasts, dismissToast } = useAppData();
  if (!toasts.length) return null;

  return (
    <div className={styles.stack}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          name={t.name}
          icon={t.icon}
          xpReward={t.xpReward}
          coinReward={t.coinReward}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}
