import { apiRequest, type ApiCredentials } from "../client";
import { toDateKey } from "../../utils/date";
import { htmlToPlainText } from "../../utils/html";

type TimeEntryResource = {
  type: "time_entries";
  id: string;
  attributes: {
    date: string;
    time: number;
    note: string | null;
  };
};

type TimeEntriesResponse = {
  data: TimeEntryResource[];
};

export type TimeEntry = {
  id: string;
  date: string; // YYYY-MM-DD, from the API's `date`
  minutes: number; // from the API's `time`
  description: string; // from the API's `note`
};

function mapTimeEntry(resource: TimeEntryResource): TimeEntry {
  return {
    id: resource.id,
    date: resource.attributes.date,
    minutes: resource.attributes.time,
    description: htmlToPlainText(resource.attributes.note ?? ""),
  };
}

// One request per week range (see docs/adr/0006-week-strip-in-day-view.md) —
// the day view's own list and the week strip's per-day totals are both
// derived client-side from this same result, rather than fetching per day.
export async function fetchTimeEntriesForRange(
  credentials: ApiCredentials,
  personId: string,
  start: Date,
  end: Date,
): Promise<TimeEntry[]> {
  const query = [
    `filter[person_id]=${encodeURIComponent(personId)}`,
    `filter[after]=${encodeURIComponent(toDateKey(start))}`,
    `filter[before]=${encodeURIComponent(toDateKey(end))}`,
    `page[size]=200`,
  ].join("&");

  const response = await apiRequest<TimeEntriesResponse>(
    `time_entries?${query}`,
    credentials,
  );

  return response.data.map(mapTimeEntry);
}
