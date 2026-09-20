import clsx from "clsx";
import { useId, type InputHTMLAttributes } from "react";
import styles from "./NumberInput.module.scss";

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

// For values that read as numeric/code but aren't a plain number input —
// e.g. the flexible duration field (docs/adr/0005-flexible-duration-field.md
// accepts `1:30`, `1.5`, `90m`, none of which fit <input type="number">).
// Always monospace, per docs/tech-stack.md's font rule for numeric values.
// Separate from TextField (see docs/tech-stack.md's "Notes on placement")
// since it also owns rendering its own validation error inline.
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
