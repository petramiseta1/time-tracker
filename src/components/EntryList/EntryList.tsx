import { useEffect, useRef, useState } from "react";
import type { TimeEntry } from "../../api/timeEntries";
import { EntryListItem } from "../EntryListItem";
import styles from "./EntryList.module.scss";

type EntryListProps = {
  entries: TimeEntry[];
};

type Row = { entry: TimeEntry; removing: boolean };

// Must match the .itemRemoving transition duration in
// EntryListItem.module.scss — how long a deleted row spends collapsing
// before it's actually dropped from the rendered list.
const REMOVE_ANIMATION_MS = 200;

function toRows(entries: TimeEntry[]): Row[] {
  return entries.map((entry) => ({ entry, removing: false }));
}

// `entries` is the authoritative day list straight from the cache — the
// moment a delete succeeds, the deleted id is just gone from it. Rendering
// that directly would snap the list shut instantly. Instead this keeps a
// local `rows` copy that mirrors `entries` but holds a just-removed row a
// beat longer, flagged `removing`, so EntryListItem can play its collapse
// animation before the row actually disappears.
export function EntryList({ entries }: EntryListProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(entries));
  const rowsRef = useRef(rows);
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const nextById = new Map(entries.map((entry) => [entry.id, entry]));
    const current = rowsRef.current;
    const hadOverlap = current.some((row) => nextById.has(row.entry.id));

    // A day switch swaps every id in the list at once — there's nothing
    // shared to animate a removal against, so show the new day outright
    // instead of playing an exit animation for the entire previous list.
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
        // Still present — refresh its data in place (covers edits) without
        // touching row order or triggering any animation.
        next.push({ entry: updated, removing: false });
        remaining.delete(row.entry.id);
      } else if (row.removing) {
        // Already collapsing from an earlier diff; its own timeout will
        // drop it once the animation finishes.
        next.push(row);
      } else {
        // Just dropped out of `entries` — start the collapse.
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

    // Anything left in `remaining` is new to the list — append it.
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
