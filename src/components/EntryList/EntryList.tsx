import { useEffect, useRef, useState } from "react";
import type { TimeEntry } from "../../api/timeEntries";
import { EntryListItem } from "../EntryListItem";
import styles from "./EntryList.module.scss";

type EntryListProps = {
  entries: TimeEntry[];
};

type Row = { entry: TimeEntry; removing: boolean };

// Must match .itemRemoving in EntryListItem.module.scss.
const REMOVE_ANIMATION_MS = 200;

function toRows(entries: TimeEntry[]): Row[] {
  return entries.map((entry) => ({ entry, removing: false }));
}

// Keep a just-deleted row mounted (flagged `removing`) so it can collapse
// before leaving the DOM.
export function EntryList({ entries }: EntryListProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(entries));
  const rowsRef = useRef(rows);
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const nextById = new Map(entries.map((entry) => [entry.id, entry]));
    const current = rowsRef.current;
    const hadOverlap = current.some((row) => nextById.has(row.entry.id));

    // Day switch replaces every id — show the new list without exit animations.
    if (current.length > 0 && !hadOverlap) {
      for (const timeoutId of timeoutsRef.current.values()) {
        clearTimeout(timeoutId);
      }
      timeoutsRef.current.clear();
      rowsRef.current = toRows(entries);
      setRows(rowsRef.current);
      return;
    }

    const remaining = new Map(nextById);
    const next: Row[] = [];

    for (const row of current) {
      const updated = remaining.get(row.entry.id);
      if (updated) {
        next.push({ entry: updated, removing: false });
        remaining.delete(row.entry.id);
      } else if (row.removing) {
        next.push(row);
      } else {
        next.push({ entry: row.entry, removing: true });
        const id = row.entry.id;
        const timeoutId = setTimeout(() => {
          timeoutsRef.current.delete(id);
          rowsRef.current = rowsRef.current.filter((r) => r.entry.id !== id);
          setRows(rowsRef.current);
        }, REMOVE_ANIMATION_MS);
        timeoutsRef.current.set(id, timeoutId);
      }
    }

    for (const entry of remaining.values()) {
      next.push({ entry, removing: false });
    }

    rowsRef.current = next;
    setRows(next);
  }, [entries]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const timeoutId of timeouts.values()) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <ul className={styles.list}>
      {rows.map((row) => (
        <EntryListItem
          key={row.entry.id}
          entry={row.entry}
          removing={row.removing}
        />
      ))}
    </ul>
  );
}
