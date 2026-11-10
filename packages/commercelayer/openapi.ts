import type { OpenapiToolNamesOptions } from "apps/openapi";
import patchData from "./patches.json" with { type: "json" };

// Commerce Layer's official Core API document. Its only server is
// https://{your_organization_slug}.commercelayer.io/api, so index.ts pins each account's own organization host.
export const defaultOrigin = "https://example.commercelayer.io";

export const originOf = (slug: string) => `https://${slug}.commercelayer.io`;

// The document points at sub-schemas (#/components/schemas/x/properties/data/...) and at four schemas it never
// declares, neither of which the compiler accepts. patches.json (generated from the document by lifting each
// referenced sub-schema into its own component, and dropping the attachable oneOf that lists four undeclared schemas) fixes both.
const patches = patchData as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://data.commercelayer.app/schemas/openapi.json" },
  allowedOrigin: defaultOrigin,
  baseUrl: `${defaultOrigin}/api`,
  patches,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
