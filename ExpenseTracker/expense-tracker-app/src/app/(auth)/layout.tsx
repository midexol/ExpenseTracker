import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.brand}>
        <h1>
          Quest<span>Log</span>
        </h1>
        <p>Level up your money habits and your to-do list.</p>
      </div>
      <div className={styles.card}>{children}</div>
    </div>
  );
}
