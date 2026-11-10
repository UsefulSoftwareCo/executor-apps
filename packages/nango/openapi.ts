import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec declares one bearer scheme for both key types. Nango rejects an environment key on
// account-level endpoints and an account key on environment endpoints, so the account-level
// operations are re-pointed at a second scheme that only the Account API key fills.
const accountOperations: ReadonlyArray<readonly [string, string]> = [
  ["/environments", "get"],
  ["/environments", "post"],
  ["/environments/{environmentUuid}", "delete"],
  ["/environments/{environmentUuid}/api-keys", "get"],
  ["/environments/{environmentUuid}/api-keys", "post"],
  ["/environments/{environmentUuid}/api-keys/{keyUuid}", "get"],
  ["/environments/{environmentUuid}/api-keys/{keyUuid}", "delete"],
];

const pointer = (segment: string) => segment.replaceAll("~", "~0").replaceAll("/", "~1");

export const options = {
  source: { url: "https://nango.dev/docs/spec.yaml" },
  allowedOrigin: "https://api.nango.dev",
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    accountAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    accountKey: [{ scheme: "accountAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: accountOperations.map(([path, method]) => ({
    op: "add" as const,
    path: `/paths/${pointer(path)}/${method}/security`,
    value: [{ accountAuth: [] }],
  })),
} satisfies OpenapiToolNamesOptions;
