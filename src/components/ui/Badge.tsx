import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

type Color = "gold" | "emerald" | "coral" | "violet" | "blue" | undefined;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color;
}

export function Badge({ color, className, children, ...rest }: BadgeProps) {
  const cls = [styles.badge, color ? styles[color] : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
