import { useRef } from "react";
import { Button } from "../Button";
import {
  addDays,
  formatFullDate,
  fromDateKey,
  toDateKey,
} from "../../utils/date";
import styles from "./DateNav.module.scss";

type DateNavProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export function DateNav({ selectedDate, onSelectDate }: DateNavProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.nav}>
      <Button
        variant="icon"
        aria-label="Previous day"
        title="Previous day"
        onClick={() => onSelectDate(addDays(selectedDate, -1))}
      >
        ←
      </Button>
      <span className={styles.dateWrapper}>
        <button
          type="button"
          className={styles.label}
          aria-label={`Jump to date, currently ${formatFullDate(selectedDate)}`}
          title="Jump to date"
          onClick={() => pickerRef.current?.showPicker?.()}
        >
          {formatFullDate(selectedDate)}
        </button>
        <input
          ref={pickerRef}
          type="date"
          className={styles.hiddenPicker}
          tabIndex={-1}
          aria-hidden="true"
          value={toDateKey(selectedDate)}
          onChange={(event) => {
            if (event.target.value) {
              onSelectDate(fromDateKey(event.target.value));
            }
          }}
        />
      </span>
      <Button
        variant="icon"
        aria-label="Next day"
        title="Next day"
        onClick={() => onSelectDate(addDays(selectedDate, 1))}
      >
        →
      </Button>
      <Button variant="secondary" onClick={() => onSelectDate(new Date())}>
        Today
      </Button>
    </div>
  );
}
