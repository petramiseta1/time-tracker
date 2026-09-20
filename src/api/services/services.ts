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

// The live API requires a `service` relationship on POST /time_entries and
// validates the person is allowed to track time on it — despite the
// assignment stating other TimeEntry relations are irrelevant (see
// docs/adr/0009-default-service-resolution.md). Since the assignment also
// puts service/task selection out of scope for the UI, we resolve one
// automatically rather than asking the user to pick: reuse a service this
// person has already tracked time on (strongest signal — proven to work),
// else one they're explicitly assigned to, else fall back to any service in
// the organization (for a brand new account with neither yet).
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
