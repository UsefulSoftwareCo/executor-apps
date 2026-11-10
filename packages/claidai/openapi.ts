import type { OpenapiToolNamesOptions } from "apps/openapi";

// POST /v1/image/edit/upload is the document's only multipart/form-data operation (file parts
// cannot be sent through the tool runtime), so it is removed; the JSON edit endpoints cover it.
export const options = {
  source: { url: "https://api.claid.ai/docs-v1.json" },
  baseUrl: "https://api.claid.ai",
  allowedOrigin: "https://api.claid.ai",
  securitySchemes: { OAuth2PasswordBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "OAuth2PasswordBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [{ op: "remove", path: "/paths/~1v1~1image~1edit~1upload" }],
} satisfies OpenapiToolNamesOptions;
