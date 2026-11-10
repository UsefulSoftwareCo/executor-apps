import type { OpenapiToolNamesOptions } from "apps/openapi";
import apiKeyPatches from "./api-key-patches.json" with { type: "json" };

// Smartlead's own Mintlify site only serves a placeholder spec, so this is the full OpenAPI 3.1
// document (98 operations) kept by API Evangelist, pinned to a commit. It is community-maintained.
// Every operation lists `api_key` as a required query parameter next to the ApiKeyAuth scheme, which would make
// the agent pass the key as a tool argument. The patches drop it so the account credential is injected at call time.
// Array values are valid at runtime; the declared patch type only admits objects.
const patches = apiKeyPatches as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/api-evangelist/smartlead-ai/64afe4f1027e83a708bb06c5b9bbf38ca695923e/openapi/_original/smartlead-ai-openapi.yml",
  },
  allowedOrigin: "https://server.smartlead.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "api_key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
