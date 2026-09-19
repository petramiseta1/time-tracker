import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  type = "button",
  variant = "secondary",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...props}
    />
  );
}
