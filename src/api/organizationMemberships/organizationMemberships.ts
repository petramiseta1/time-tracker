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
  // Undefined if the API's `people` attributes don't shape up as expected —
  // the header's avatar is decorative, so we degrade to not showing it
  // rather than failing login over it. Attribute names (`first_name`/
  // `last_name`) are the Productive API's documented shape but unconfirmed
  // against the live test account — worth checking once logged in.
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

// include=person is required: by default the API omits the person
// relationship's resource linkage entirely (relationships.person comes back
// as just `{ meta: { included: false } }`, no `data`), so the Person id
// can't be read off the membership without asking for it explicitly. We
// read it from relationships.person.data if the API populates that once
// included, falling back to the top-level `included` array otherwise.
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
