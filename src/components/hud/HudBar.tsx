"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { useTheme } from "@/lib/ThemeContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./HudBar.module.css";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/todos", label: "Quest Log", icon: "quests" },
  { href: "/expenses", label: "Gold Tracker", icon: "gold" },
  { href: "/habits", label: "Habit Rituals", icon: "habits" },
  { href: "/75hard", label: "75 Hard", icon: "hard" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ type }: { type: string }) {
  if (type === "dashboard") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (type === "analytics") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    );
  }
  if (type === "quests") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
      </svg>
    );
  }
  if (type === "gold") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M9 9.5c0-1.5 1.5-2 3-2s3 .5 3 2c0 2.5-4 2.5-4 5c0 1.5 1.5 2 3 2s3-.5 3-2" />
      </svg>
    );
  }
  if (type === "habits") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.5M14 2v7.5M8.5 2h7M6 14.5a6 6 0 1 0 12 0V9.5H6v5z" />
      </svg>
    );
  }
  if (type === "hard") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function HudBar() {
  const { me } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initialLetter = me?.name ? me.name[0].toUpperCase() : "Q";

  return (
    <>
      {/* Desktop Left Fixed Sidebar */}
      <aside className={styles.sidebarWrap}>
        <div className={styles.logoBlock}>
          <span className={styles.logo}>
            Quest<span>Log</span>
          </span>
          <button className={styles.themeToggleBtn} onClick={toggleTheme} title="Toggle Light/Dark Theme">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className={styles.profileHeroCard}>
          <div className={styles.heroAvatarRing}>
            <div className={styles.heroAvatarInner}>{initialLetter}</div>
          </div>
          <div>
            <div className={styles.heroTitle}>{me?.name ?? "Adventurer"}</div>
            <div className={styles.heroSubtitle}>Level {me?.level ?? 1} Paladin</div>
          </div>

          <div className={styles.xpTrack}>
            <div className={styles.xpTextRow}>
              <span>XP Progress</span>
              <span>{me ? `${me.xpIntoLevel} / ${me.xpForNextLevel}` : "0/100"}</span>
            </div>
            <ProgressBar pct={me?.progressPct ?? 0} color="gold" segments={10} />
          </div>
        </div>

        <button className={styles.newQuestBtn} onClick={() => router.push("/todos")}>
          + Start New Quest
        </button>

        <nav className={styles.navSection}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>
                  <NavIcon type={link.icon} />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className={styles.themeToggleBtn} style={{ marginTop: "auto" }} onClick={handleLogout}>
          Log out
        </button>
      </aside>

      {/* Mobile Top Sticky Header */}
      <div className={styles.mobileHeader}>
        <span className={styles.logo}>
          Quest<span>Log</span>
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--highlight)" }}>
            LV {me?.level ?? 1}
          </span>
          <button className={styles.themeToggleBtn} onClick={toggleTheme}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Fixed Navigation */}
      <nav className={styles.mobileBottomNav}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}
            >
              <NavIcon type={link.icon} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
