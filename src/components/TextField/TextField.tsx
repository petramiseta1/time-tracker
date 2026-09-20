import clsx from "clsx";
import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.scss";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  mono?: boolean;
  error?: string;
};

export function TextField({
  label,
  mono = false,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
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
        className={clsx(styles.input, mono && styles.mono, className)}
        {...props}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
