import { useAuth } from "../../context/AuthContext";
import styles from "./TimeEntryPage.module.scss";

// Placeholder day view — real entry listing/add/edit/delete land in
// tickets 03-06.
export function TimeEntryPage() {
  const { logout } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Productive Time Tracker</h1>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Log out
        </button>
      </header>
      <main className={styles.main}>
        <p className={styles.placeholder}>Day view coming in ticket 03.</p>
      </main>
    </div>
  );
}
