import { Button } from "../Button";
import styles from "./ErrorBanner.module.scss";

type ErrorBannerProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorBanner({
  title = "Something went wrong",
  description,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
