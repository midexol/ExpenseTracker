import type { HTMLAttributes } from "react";
import styles from "./Panel.module.css";

type Accent = "gold" | "emerald" | "coral" | "violet" | "forest" | "crimson" | "cream" | undefined;

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  small?: boolean;
}

const ACCENT_CLASS: Record<string, string> = {
  gold: styles.accentGold,
  emerald: styles.accentEmerald,
  coral: styles.accentCoral,
  violet: styles.accentViolet,
  forest: styles.accentForest,
  crimson: styles.accentCrimson,
  cream: styles.accentCream,
};

export function Panel({ accent, small, className, children, ...rest }: PanelProps) {
  const frameClass = [styles.bentoCard, accent ? ACCENT_CLASS[accent] : "", small ? styles.small : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[frameClass, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
