import type { TimeEntry } from "../../api/timeEntries";
import { EntryListItem } from "../EntryListItem";
import styles from "./EntryList.module.scss";

type EntryListProps = {
  entries: TimeEntry[];
};

export function EntryList({ entries }: EntryListProps) {
  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <EntryListItem key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}
