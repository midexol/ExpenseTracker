"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { apiRequest } from "@/lib/apiClient";
import { ACHIEVEMENT_ICONS, type AchievementIconKey } from "@/components/icons/GameIcons";
import type { Achievement } from "@/lib/types";
import styles from "./achievements.module.css";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ achievements: Achievement[] }>("/api/achievements").then((data) => {
      setAchievements(data.achievements);
      setLoading(false);
    });
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Achievements</h1>
        {!loading ? (
          <p style={{ color: "var(--text-dim)", marginTop: "0.3rem" }}>
            {unlockedCount} / {achievements.length} unlocked
          </p>
        ) : null}
      </div>

      <div className={styles.grid}>
        {achievements.map((a) => {
          const Icon = ACHIEVEMENT_ICONS[a.icon as AchievementIconKey] ?? ACHIEVEMENT_ICONS.trophy;
          const unlocked = !!a.unlockedAt;
          return (
            <Panel key={a.id} accent={unlocked ? "gold" : undefined} className={!unlocked ? styles.locked : ""}>
              <div className={styles.card}>
                <div className={styles.iconWrap}>
                  <Icon width={22} height={22} />
                </div>
                <div>
                  <div className={styles.name}>{a.name}</div>
                  <div className={styles.desc}>{a.description}</div>
                  <div className={styles.rewards}>
                    +{a.xpReward} XP{a.coinReward ? ` · +${a.coinReward} coins` : ""}
                  </div>
                  {unlocked ? (
                    <div className={styles.unlockedDate}>
                      Unlocked {new Date(a.unlockedAt as string).toLocaleDateString()}
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
