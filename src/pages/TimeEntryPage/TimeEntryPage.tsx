import { useToast } from "../../context/ToastContext";
import styles from "./TimeEntryPage.module.scss";

// Placeholder day view — real entry listing/add/edit/delete land in
// tickets 03-06. The dev-build-only "fire a test toast" button is a
// temporary manual verification aid for ticket 01 and should be removed
// once ticket 02 gives the toast system a real trigger (login errors).
export function TimeEntryPage() {
  const { showToast } = useToast();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Productive Time Tracker</h1>
      </header>
      <main className={styles.main}>
        <p className={styles.placeholder}>Day view coming in ticket 03.</p>
        {import.meta.env.DEV && (
          <button
            type="button"
            className={styles.devTrigger}
            onClick={() =>
              showToast("Test toast from the app shell", "success")
            }
          >
            Fire test toast (dev only)
          </button>
        )}
      </main>
    </div>
  );
}
