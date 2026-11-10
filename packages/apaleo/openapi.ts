import type { OpenapiToolNamesOptions } from "apps/openapi";
import { patches } from "./patches.ts";

// Apaleo publishes one official Swagger 2.0 document per API area at api.apaleo.com/swagger/<area>/swagger.json.
// The documents declare no host; every area is served from https://api.apaleo.com. Each operation names the
// `oauth2` scheme, which Apaleo accepts as a bearer access token (authorization code or client credentials).
export const areas = {
  booking: "Reservations, bookings, groups, blocks, offers, authorizations and payment accounts.",
  finance: "Folios, charges, payments, invoices, accounting and subledger.",
  inventory: "Properties, unit groups, units and unit attributes.",
  rateplan: "Rate plans, rates and services.",
  availability: "Availability, unit group availability and unit status.",
  settings: "Property and account settings.",
  operations: "Housekeeping, maintenance and night audit.",
  reports: "Reports and statistics.",
  account: "The current Apaleo account.",
  logs: "Audit and event logs.",
} as const;

export type Area = keyof typeof areas;

export const areaOptions = (area: Area) =>
  ({
    source: { url: `https://api.apaleo.com/swagger/${area}-v1/swagger.json` },
    allowedOrigin: "https://api.apaleo.com",
    baseUrl: "https://api.apaleo.com",
    securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ oauth2: [] }],
    methods: { oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }] },
    oauth: [],
    ...(patches[area] ? { patches: patches[area] } : {}),
  }) satisfies OpenapiToolNamesOptions;

export const options = areaOptions("booking");
