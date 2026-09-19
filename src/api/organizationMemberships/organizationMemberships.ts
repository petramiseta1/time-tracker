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
};

type OrganizationMembershipsResponse = {
  data: OrganizationMembershipResource[];
  included?: IncludedResource[];
};

export type ResolvedMembership = {
  organizationId: string;
  personId: string;
};

// Looks up the membership for the entered Organization ID via the API's own
// filter[organization_id], rather than fetching every membership the token
// has and searching client-side. Returns null if the token is valid but no
// membership matches — the caller (AuthContext) also treats a 403/404 from
// this request itself as the same outcome, per
// docs/adr/0002-distinguish-login-errors.md.
//
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

  return personId
    ? { organizationId: credentials.organizationId, personId }
    : null;
}
