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
  links?: {
    next?: string | null;
  };
};

export type TimeEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number; // API `time`
  description: string; // API `note`
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

// The API requires a `service` relationship on create.
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

// Used when the edit route is opened with nothing in the week cache.
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

export async function deleteTimeEntry(
  credentials: ApiCredentials,
  id: string,
): Promise<void> {
  await apiRequest<undefined>(`time_entries/${id}`, credentials, {
    method: "DELETE",
  });
}

// Week range; walks `links.next` so results aren't truncated at page size.
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
    `page[after]=`,
    `page[size]=200`,
  ].join("&");

  const entries: TimeEntry[] = [];
  let path: string | undefined = `time_entries?${query}`;

  while (path) {
    const response: TimeEntriesResponse = await apiRequest(path, credentials);
    entries.push(...response.data.map(mapTimeEntry));
    path = response.links?.next ?? undefined;
  }

  return entries;
}
