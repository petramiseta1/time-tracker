import { apiRequest, type ApiCredentials } from "../client";

type JsonApiResourceRef = {
  type: string;
  id: string;
};

type OrganizationMembershipResource = {
  type: "organization_memberships";
  id: string;
  relationships: {
    organization?: { data?: JsonApiResourceRef | null };
    person?: { data?: JsonApiResourceRef | null };
  };
};

type IncludedResource = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
};

type OrganizationMembershipsResponse = {
  data: OrganizationMembershipResource[];
  included?: IncludedResource[];
};

export type ResolvedMembership = {
  organizationId: string;
  personId: string;
  // Optional — a missing name shouldn't fail login.
  personName?: string;
};

function personNameFromAttributes(
  attributes: Record<string, unknown> | undefined,
): string | undefined {
  const firstName =
    typeof attributes?.first_name === "string" ? attributes.first_name : "";
  const lastName =
    typeof attributes?.last_name === "string" ? attributes.last_name : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || undefined;
}

// `include=person` is required; without it the API omits the person id.
// Prefer relationships.person.data, else the included array.
export async function findMembershipForOrganization(
  credentials: ApiCredentials,
): Promise<ResolvedMembership | null> {
  const response = await apiRequest<OrganizationMembershipsResponse>(
    `organization_memberships?filter[organization_id]=${encodeURIComponent(credentials.organizationId)}&include=person`,
    credentials,
  );

  const membership = response.data[0];
  if (!membership) {
    return null;
  }

  const personId =
    membership.relationships.person?.data?.id ??
    response.included?.find((resource) => resource.type === "people")?.id;

  if (!personId) {
    return null;
  }

  const personResource = response.included?.find(
    (resource) => resource.type === "people" && resource.id === personId,
  );

  return {
    organizationId: credentials.organizationId,
    personId,
    personName: personNameFromAttributes(personResource?.attributes),
  };
}
