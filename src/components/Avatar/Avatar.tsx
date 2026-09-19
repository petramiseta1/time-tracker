import { getInitials } from "../../utils/initials";
import styles from "./Avatar.module.scss";

type AvatarProps = {
  name: string;
};

export function Avatar({ name }: AvatarProps) {
  return (
    <span className={styles.avatar} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
