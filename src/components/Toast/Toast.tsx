import clsx from "clsx";
import { useToast } from "../../context/ToastContext";
import styles from "./Toast.module.scss";

export function ToastStack() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.stack}>
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            className={clsx(styles.toast, styles[toast.type])}
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
          >
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.dismiss}
              aria-label={`Dismiss: ${toast.message}`}
              title="Dismiss"
              onClick={() => dismissToast(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
