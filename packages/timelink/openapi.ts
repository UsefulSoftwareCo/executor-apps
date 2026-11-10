import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.timelink.io/docs" },
  allowedOrigin: "https://api.timelink.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    // Vendor typo: PUT/PATCH /timeEntries/ext{ext-id} (missing slash) are not real routes.
    { op: "remove", path: "/paths/~1timeEntries~1ext{ext-id}" },
    // The document declares this path parameter with "in": null; it is a path parameter.
    {
      op: "replace",
      path: "/paths/~1hooks~1{id}~1unsubscribe/delete/parameters",
      value: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    },
  ],
} satisfies OpenapiToolNamesOptions;
