import { AppDataProvider } from "@/lib/AppDataContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { HudBar } from "@/components/hud/HudBar";
import { AchievementToastStack } from "@/components/hud/AchievementToast";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <ThemeProvider>
        <div className={styles.appWrap}>
          <HudBar />
          <AchievementToastStack />
          <main className={styles.main}>{children}</main>
        </div>
      </ThemeProvider>
    </AppDataProvider>
  );
}
