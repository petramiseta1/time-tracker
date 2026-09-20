const API_BASE_URL = "https://api.productive.io/api/v2/";

export type ApiCredentials = {
  token: string;
  organizationId: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiRequest<TResponse>(
  path: string,
  credentials: ApiCredentials,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  // Absolute URLs (JSON:API `links.next`) are requested as-is.
  const url = path.startsWith("https://") ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/vnd.api+json",
      "X-Auth-Token": credentials.token,
      "X-Organization-Id": credentials.organizationId,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed with status ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
