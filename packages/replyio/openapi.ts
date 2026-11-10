import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Reply's official bundled document (https://docs.reply.io/api-reference/bundled.yaml), converted
// from YAML to JSON unchanged (converted 2026-10-12). The live YAML repeats ~3,800 YAML aliases, past the framework parser's
// 100-alias limit, so it cannot be fetched directly.
const security: Record<string, string[]>[] = [
  { bearerAuth: [], actingUserEmail: [], actingTeamId: [] },
  { bearerAuth: [], actingUserId: [] },
  { bearerAuth: [], actingUserEmail: [] },
  { bearerAuth: [] },
];

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.reply.io",
  // Team and organization keys act as a user, named by X-User-Id or by X-User-Email with X-Team-Id.
  // Organization keys always need one of those. Each alternative below is used only when its
  // account fields are filled, most specific first; a plain user key matches the last one.
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    actingUserId: { type: "apiKey", in: "header", name: "X-User-Id" },
    actingUserEmail: { type: "apiKey", in: "header", name: "X-User-Email" },
    actingTeamId: { type: "apiKey", in: "header", name: "X-Team-Id" },
  },
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "actingUserId", field: "userId", part: "value", prefix: "" },
      { scheme: "actingUserEmail", field: "userEmail", part: "value", prefix: "" },
      { scheme: "actingTeamId", field: "teamId", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  patches: [
    {
      op: "replace",
      path: "/security",
      value: security,
    },
  ],
} satisfies OpenapiToolNamesOptions;
