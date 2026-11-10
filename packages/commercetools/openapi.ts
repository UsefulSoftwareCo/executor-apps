import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// commercetools' official Composable Commerce HTTP API document, vendored as openapi.json: the published
// https://raw.githubusercontent.com/commercetools/commercetools-api-reference/main/oas/api/openapi.yaml is not valid YAML for a
// strict parser (a multi-line quoted scalar under BusinessUnitStatus is under-indented), so the app's loader rejects it. The JSON is
// that file parsed by PyYAML, unchanged otherwise.
// Its server is https://api.{region}.commercetools.com
// with five regions; index.ts pins each account's own region host. Every path starts with /{projectKey}, which stays a
// tool argument. index.ts adds the bearer token minted from the account's API client.
export const regions = [
  "us-central1.gcp",
  "us-east-2.aws",
  "europe-west1.gcp",
  "eu-central-1.aws",
  "australia-southeast1.gcp",
] as const;

export const apiOrigin = (region: string) => `https://api.${region}.commercetools.com`;
export const authOrigin = (region: string) => `https://auth.${region}.commercetools.com`;

export const defaultOrigin = apiOrigin(regions[0]);

export const options = {
  source: { document: document as unknown as Extract<OpenapiToolNamesOptions["source"], { document: unknown }>["document"] },
  allowedOrigin: defaultOrigin,
  baseUrl: defaultOrigin,
  securitySchemes: { oauth_2_0: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth_2_0: [] }],
  methods: { apiClient: [{ scheme: "oauth_2_0", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
