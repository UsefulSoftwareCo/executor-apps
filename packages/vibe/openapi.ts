import type { OpenapiToolNamesOptions } from "apps/openapi";

// Vibe publishes its OpenAPI definition (revision 2026-06-01) through its ReadMe developer hub's
// API registry. Every request must carry the X-Vibe-Revision header, which the definition does not
// declare, so the header is added to each path as a parameter and bound to its default in index.ts.
const paths = [
  "/accounts",
  "/advertisers",
  "/advertisers/{advertiser_id}",
  "/advertisers/{advertiser_id}/audiences",
  "/audiences",
  "/audiences/{audience_id}",
  "/audiences/{audience_id}/stats",
  "/audiences/{audience_id}/syncs",
  "/audiences/{audience_id}/syncs/upload",
  "/audiences/{audience_id}/syncs/upload-url",
  "/audiences/{audience_id}/syncs/{sync_id}",
  "/audiences/{audience_id}/syncs/{sync_id}/actions",
  "/audiences/{audience_id}/syncs/{sync_id}/batches",
  "/billing/balance",
  "/billing/invoices",
  "/billing/invoices/{invoice_id}",
  "/billing/operations",
  "/campaigns",
  "/campaigns/{campaign_id}",
  "/campaigns/{campaign_id}/actions",
  "/campaigns/{campaign_id}/creatives",
  "/campaigns/{campaign_id}/duplicate",
  "/campaigns/{campaign_id}/publish",
  "/catalog/channels",
  "/catalog/channels/{channel_id}",
  "/catalog/devices",
  "/creatives",
  "/creatives/upload-url",
  "/creatives/video",
  "/creatives/{creative_id}",
  "/geo/locations",
  "/reports",
  "/reports/purchases",
  "/reports/{report_id}",
  "/segments/ages",
  "/segments/demographics",
  "/segments/genders",
  "/segments/interests",
  "/strategies",
  "/strategies/{strategy_id}",
  "/strategies/{strategy_id}/actions",
  "/strategies/{strategy_id}/creatives",
  "/strategies/{strategy_id}/duplicate",
] as const;

const escape = (path: string) => path.replace(/~/g, "~0").replace(/\//g, "~1");

const bearer = [{ scheme: "bearer", field: "access_token", part: "value" as const, prefix: "" }];

export const revision = "2026-06-01";

export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/zzgkl994mu1rv647" },
  allowedOrigin: "https://api.vibe.co",
  securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
  methods: { oauth: bearer, serverToServer: bearer },
  oauth: [],
  // POST and PATCH /accounts need the account:write admin scope, which is deliberately not requested.
  patches: [
    ...paths.map((path) => ({
    op: "add" as const,
    path: `/paths/${escape(path)}/parameters`,
    value: [{ name: "X-Vibe-Revision", in: "header", required: false, schema: { type: "string", default: revision } }],
  })),
    { op: "remove" as const, path: "/paths/~1accounts/post" },
    { op: "remove" as const, path: "/paths/~1accounts/patch" },
  ],
} satisfies OpenapiToolNamesOptions;
