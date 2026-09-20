import styles from "./LogoMark.module.scss";

type LogoMarkProps = {
  size?: number;
};

export function LogoMark({ size = 22 }: LogoMarkProps) {
  return (
    <span
      className={styles.logoMark}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 7.5V12l3 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
