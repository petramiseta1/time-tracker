import styles from "./LoginPage.module.scss";

// Placeholder — the real login form (API token + Organization ID, session
// persistence, error handling) is built in ticket 02.
export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>Login form coming in ticket 02.</p>
      </div>
    </div>
  );
}
