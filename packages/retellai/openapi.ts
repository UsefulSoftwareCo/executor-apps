import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.retellai.com/openapi.yaml" },
  allowedOrigin: "https://api.retellai.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Read-only operations Retell exposes as POST (search and list endpoints with request bodies).
  kinds: {
    "searchCommunityVoice": "query",
    "listAgents": "query",
    "listChats": "query",
    "listCalls": "query",
    "listContacts": "query",
    "getAppToolSchema": "query",
  },
} satisfies OpenapiToolNamesOptions;
