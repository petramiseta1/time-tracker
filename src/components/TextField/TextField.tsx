import clsx from "clsx";
import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.scss";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  mono?: boolean;
};

export function TextField({
  label,
  mono = false,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={clsx(styles.input, mono && styles.mono, className)}
        {...props}
      />
    </div>
  );
}
