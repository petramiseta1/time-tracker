import clsx from "clsx";
import { useId, type InputHTMLAttributes } from "react";
import styles from "./NumberInput.module.scss";

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

// Text input for numeric-looking values that aren't a plain number
// (e.g. 1:30, 1.5h).
export function NumberInput({
  label,
  error,
  id,
  className,
  ...props
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={clsx(styles.input, className)}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
