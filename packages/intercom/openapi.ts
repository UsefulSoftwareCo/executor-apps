import type { OpenapiToolNamesOptions } from "apps/openapi";

export const regionUrls = {
  us: "https://api.intercom.io",
  eu: "https://api.eu.intercom.io",
  au: "https://api.au.intercom.io",
} as const;

// The schema builders have no enum or union, so the region is checked here. OAuth accounts pass "us":
// api.intercom.io routes requests to the workspace's region.
export const apiUrl = (region: string) => {
  if (!Object.hasOwn(regionUrls, region)) throw new Error(`Unknown Intercom region "${region}". Use us, eu or au.`);
  return regionUrls[region as keyof typeof regionUrls];
};

// These POST operations only read (search and list), so they are queries and need no approval.
export const readOperations = [
  "searchActivityLogs",
  "SearchContacts",
  "searchConversations",
  "searchTickets",
  "listAllCompanies",
  "listCallsWithTranscripts",
];

// Intercom's official OpenAPI description (API version 2.16) lists the three regional hosts as servers.
export const optionsFor = (region: string) =>
  ({
    source: {
      url: "https://raw.githubusercontent.com/intercom/Intercom-OpenAPI/main/descriptions/2.16/api.intercom.io.yaml",
    },
    allowedOrigin: apiUrl(region),
    baseUrl: apiUrl(region),
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    methods: {
      token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
      oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
    kinds: Object.fromEntries(readOperations.map((id) => [id, "query" as const])),
  }) satisfies OpenapiToolNamesOptions;

export const options = optionsFor("us");
