import type { OpenapiToolNamesOptions } from "apps/openapi";

// Seven operations ship vendor-generated hash operationIds that change when the spec is regenerated;
// the patches give them stable names.
const patches = [
  { op: "replace", path: "/paths/~1api~1files/get/operationId", value: "listFiles" },
  { op: "replace", path: "/paths/~1api~1files~1save/post/operationId", value: "saveFile" },
  { op: "replace", path: "/paths/~1api~1files~1download~1{id}/get/operationId", value: "getFileDownloadUrl" },
  { op: "replace", path: "/paths/~1api~1templates/get/operationId", value: "listTemplates" },
  { op: "replace", path: "/paths/~1api~1templates~1{id}~1placeholders/get/operationId", value: "getTemplatePlaceholders" },
  { op: "replace", path: "/paths/~1api~1workflows/get/operationId", value: "listWorkflows" },
  { op: "replace", path: "/paths/~1api~1workflows~1{id}~1placeholders/get/operationId", value: "getWorkflowPlaceholders" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// ActiveMerge's own OpenAPI document (the one behind its Swagger UI). Its server is "/", so the
// requests go to the host that serves the document.
export const options = {
  source: { url: "https://app.activemerge.com/docs" },
  allowedOrigin: "https://app.activemerge.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "API-KEY", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;
