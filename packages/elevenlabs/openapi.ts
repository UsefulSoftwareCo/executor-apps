import type { OpenapiToolNamesOptions } from "apps/openapi";
import headerPatches from "./header-patches.json" with { type: "json" };

// ElevenLabs' official OpenAPI document declares no security scheme: every operation takes an
// optional `xi-api-key` header parameter instead. Declare the scheme globally so the account's
// key is injected. `header-patches.json` (generated from the document: each operation's `parameters` list
// without the `xi-api-key` header) removes that parameter so a model cannot supply its own key. The
// framework cannot delete one array element, so each affected operation's list is replaced whole.
// `GET /docs` is a redirect to the documentation website, not an API operation, so it is removed.
export const options = {
  source: { url: "https://api.elevenlabs.io/openapi.json" },
  allowedOrigin: "https://api.elevenlabs.io",
  baseUrl: "https://api.elevenlabs.io",
  securitySchemes: { xiApiKey: { type: "apiKey", in: "header", name: "xi-api-key" } },
  methods: { apiKey: [{ scheme: "xiApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1docs" },
    ...(headerPatches as { op: "replace"; path: string; value: never }[]),
    { op: "add", path: "/components/securitySchemes", value: { xiApiKey: { type: "apiKey", in: "header", name: "xi-api-key" } } },
    { op: "add", path: "/security", value: [{ xiApiKey: [] }] },
  ],
} satisfies OpenapiToolNamesOptions;
