import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec requires bearerAuth and tokenAuth (api_token query) together on every operation.
// The bearer token alone is accepted, so each operation is narrowed to bearerAuth and the token
// never travels in a URL.
const patches = [
  { op: "replace", path: "/paths/~1analytics~1raw~1json/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1timeline/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1general/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1popularity~1weekday/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1popularity~1hour/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1sources~1top/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1languages~1top/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1location~1{region}/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1bulk/post/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1bulk~1{bulkRequestId}~1status/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1bulk~1{bulkRequestId}~1report/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1create/post/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1update/patch/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1change/patch/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1alias~1{domain}~1{alias}/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1alias~1{domain}~1{alias}/delete/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1urls~1{type}/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1urls~1{type}~1count/get/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1archive/patch/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1status/patch/security", value: [{ bearerAuth: [] }] },
  { op: "replace", path: "/paths/~1analytics~1sharing/patch/security", value: [{ bearerAuth: [] }] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://tinyurl.com/openapi/v2.json" },
  allowedOrigin: "https://api.tinyurl.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;
