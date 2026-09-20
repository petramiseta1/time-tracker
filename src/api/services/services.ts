import { apiRequest, type ApiCredentials } from "../client";

type JsonApiResourceRef = {
  type: string;
  id: string;
};

type TimeEntryWithServiceResource = {
  type: "time_entries";
  id: string;
  relationships: {
    service?: { data?: JsonApiResourceRef | null };
  };
};

type ServiceAssignmentResource = {
  type: "service_assignments";
  id: string;
  relationships: {
    service?: { data?: JsonApiResourceRef | null };
  };
};

type ServiceResource = {
  type: "services";
  id: string;
};

async function firstServiceIdFromExistingEntries(
  credentials: ApiCredentials,
  personId: string,
): Promise<string | null> {
  const response = await apiRequest<{ data: TimeEntryWithServiceResource[] }>(
    `time_entries?filter[person_id]=${encodeURIComponent(personId)}&page[size]=1`,
    credentials,
  );
  return response.data[0]?.relationships.service?.data?.id ?? null;
}

async function firstServiceIdFromAssignments(
  credentials: ApiCredentials,
  personId: string,
): Promise<string | null> {
  const response = await apiRequest<{ data: ServiceAssignmentResource[] }>(
    `service_assignments?filter[person_id]=${encodeURIComponent(personId)}&page[size]=1`,
    credentials,
  );
  return response.data[0]?.relationships.service?.data?.id ?? null;
}

async function firstServiceIdInOrganization(
  credentials: ApiCredentials,
): Promise<string | null> {
  const response = await apiRequest<{ data: ServiceResource[] }>(
    `services?page[size]=1`,
    credentials,
  );
  return response.data[0]?.id ?? null;
}

// POST /time_entries requires a service. Pick one automatically: already
// used, then assigned, then any in the org.
export async function resolveDefaultServiceId(
  credentials: ApiCredentials,
  personId: string,
): Promise<string | null> {
  const fromEntries = await firstServiceIdFromExistingEntries(
    credentials,
    personId,
  );
  if (fromEntries) {
    return fromEntries;
  }

  const fromAssignments = await firstServiceIdFromAssignments(
    credentials,
    personId,
  );
  if (fromAssignments) {
    return fromAssignments;
  }

  return firstServiceIdInOrganization(credentials);
}
