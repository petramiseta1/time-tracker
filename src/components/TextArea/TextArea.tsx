import clsx from "clsx";
import { useId, type TextareaHTMLAttributes } from "react";
import styles from "./TextArea.module.scss";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

// Separate from TextField (see docs/tech-stack.md's "Notes on placement")
// since multiline text and its own validation error are distinct enough to
// earn their own component.
export function TextArea({
  label,
  error,
  id,
  className,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        id={textareaId}
        className={clsx(styles.textarea, className)}
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
