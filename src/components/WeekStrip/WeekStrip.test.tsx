import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fromDateKey } from "../../utils/date";
import { WeekStrip } from "./WeekStrip";
import styles from "./WeekStrip.module.scss";

// A fixed week (Mon 2026-03-02 – Sun 2026-03-08) so "today" is predictable.
const weekDates = [
  "2026-03-02",
  "2026-03-03",
  "2026-03-04",
  "2026-03-05",
  "2026-03-06",
  "2026-03-07",
  "2026-03-08",
].map(fromDateKey);

describe("WeekStrip", () => {
  it("renders one button per day", () => {
    render(
      <WeekStrip
        weekDates={weekDates}
        selectedDate={weekDates[0]}
        totalsByDate={new Map()}
        onSelectDate={() => {}}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(7);
  });

  it("marks the selected day as pressed", () => {
    render(
      <WeekStrip
        weekDates={weekDates}
        selectedDate={weekDates[2]}
        totalsByDate={new Map()}
        onSelectDate={() => {}}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a dash for a day with no entries and hours for a day with entries", () => {
    render(
      <WeekStrip
        weekDates={weekDates}
        selectedDate={weekDates[0]}
        totalsByDate={new Map([["2026-03-03", 90]])}
        onSelectDate={() => {}}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("—");
    expect(buttons[1]).toHaveTextContent("1.5h");
  });

  it("flags a day that goes over the daily target", () => {
    render(
      <WeekStrip
        weekDates={weekDates}
        selectedDate={weekDates[0]}
        totalsByDate={new Map([["2026-03-02", 9 * 60]])}
        onSelectDate={() => {}}
      />,
    );

    const hours = screen
      .getAllByRole("button")[0]
      .querySelector(`.${styles.hours}`);
    expect(hours).toHaveClass(styles.overTarget);
  });

  it("calls onSelectDate with the clicked day", () => {
    const onSelectDate = vi.fn();
    render(
      <WeekStrip
        weekDates={weekDates}
        selectedDate={weekDates[0]}
        totalsByDate={new Map()}
        onSelectDate={onSelectDate}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[3]);

    expect(onSelectDate).toHaveBeenCalledWith(weekDates[3]);
  });
});
