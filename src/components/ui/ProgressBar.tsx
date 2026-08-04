import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  pct: number;
  color?: "gold" | "emerald" | "coral" | "violet";
  segments?: number;
}

export function ProgressBar({ pct, color = "gold", segments = 10 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={styles.track}>
      <div className={[styles.fill, styles[color]].join(" ")} style={{ width: `${clamped}%` }} />
      <div className={styles.ticks}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className={styles.tick} />
        ))}
      </div>
    </div>
  );
}
