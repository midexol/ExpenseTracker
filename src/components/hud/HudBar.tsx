"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { CoinIcon, FlameIcon, StarIcon } from "@/components/icons/GameIcons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./HudBar.module.css";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/todos", label: "Quests" },
  { href: "/habits", label: "Habits & 75 Hard" },
  { href: "/achievements", label: "Achievements" },
  { href: "/settings", label: "Settings" },
];

export function HudBar() {
  const { me } = useAppData();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <span className={styles.logo}>
          Quest<span>Log</span>
        </span>

        <span className={styles.levelBadge}>
          <StarIcon width={13} height={13} />
          LV {me?.level ?? 1}
        </span>

        <div className={styles.xpBlock}>
          <span className={styles.xpLabel}>
            {me ? `${me.xpIntoLevel} / ${me.xpForNextLevel} XP` : "XP"}
          </span>
          <ProgressBar pct={me?.progressPct ?? 0} color="gold" segments={12} />
        </div>

        <span className={`${styles.stat} ${styles.statCoin}`}>
          <CoinIcon className={styles.statIcon} />
          {me?.coins ?? 0}
        </span>

        <span className={`${styles.stat} ${styles.statStreak}`}>
          <FlameIcon className={styles.statIcon} />
          {me?.currentStreak ?? 0}
        </span>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <nav className={styles.nav}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
