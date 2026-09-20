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

export type NewTimeEntryInput = {
  date: string; // YYYY-MM-DD
  minutes: number;
  description: string;
  serviceId: string;
};

export type UpdateTimeEntryInput = {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  description: string;
};

type SingleTimeEntryResponse = {
  data: TimeEntryResource;
};

// `service` is required in practice, despite the assignment stating other
// TimeEntry relations are irrelevant — see
// docs/adr/0009-default-service-resolution.md. No `task` relationship;
// that one really does appear optional.
export async function createTimeEntry(
  credentials: ApiCredentials,
  personId: string,
  input: NewTimeEntryInput,
): Promise<TimeEntry> {
  const response = await apiRequest<SingleTimeEntryResponse>(
    "time_entries",
    credentials,
    {
      method: "POST",
      body: {
        data: {
          type: "time_entries",
          attributes: {
            date: input.date,
            time: input.minutes,
            note: input.description,
          },
          relationships: {
            person: { data: { type: "people", id: personId } },
            service: { data: { type: "services", id: input.serviceId } },
          },
        },
      },
    },
  );

  return mapTimeEntry(response.data);
}

// Single-resource GET, used to resolve an entry directly by id — the edit
// route (`/entries/:id`, ADR 0004) may be reached with nothing about that
// entry cached yet (a fresh tab, a direct link, a reload), so it can't rely
// on the week list already having fetched it.
export async function fetchTimeEntry(
  credentials: ApiCredentials,
  id: string,
): Promise<TimeEntry> {
  const response = await apiRequest<SingleTimeEntryResponse>(
    `time_entries/${id}`,
    credentials,
  );

  return mapTimeEntry(response.data);
}

// No `service` relationship on the request body — the edit form only ever
// touches date/duration/description (docs/adr/0009-default-service-resolution.md
// covers why `service` matters for create; it's unrelated to editing an
// entry that already has one).
export async function updateTimeEntry(
  credentials: ApiCredentials,
  input: UpdateTimeEntryInput,
): Promise<TimeEntry> {
  const response = await apiRequest<SingleTimeEntryResponse>(
    `time_entries/${input.id}`,
    credentials,
    {
      method: "PATCH",
      body: {
        data: {
          type: "time_entries",
          id: input.id,
          attributes: {
            date: input.date,
            time: input.minutes,
            note: input.description,
          },
        },
      },
    },
  );

  return mapTimeEntry(response.data);
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
