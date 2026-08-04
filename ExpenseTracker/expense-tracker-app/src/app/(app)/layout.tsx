import { AppDataProvider } from "@/lib/AppDataContext";
import { HudBar } from "@/components/hud/HudBar";
import { AchievementToastStack } from "@/components/hud/AchievementToast";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <HudBar />
      <AchievementToastStack />
      <main className={styles.main}>{children}</main>
    </AppDataProvider>
  );
}
