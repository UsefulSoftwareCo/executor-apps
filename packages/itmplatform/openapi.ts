import type { OpenapiToolNamesOptions } from "apps/openapi";
import { login, v1Operations, v2Operations } from "./versions.ts";

// Official ITM Platform API document. Operations declare their own server: v1 at
// https://api.itmplatform.com/<company> and v2 at https://api.itmplatform.com/v2/<company>. index.ts mounts one
// router per version (`v1`, `v2`), sets the base URL per account, and each router removes the other version's
// operations (versions.ts). Every operation takes a `Token` header holding a session token; index.ts exchanges the
// account's API key for it, so the key is bound here and replaced on the wire. GET /login/{APIKey} is removed so
// the key never becomes a tool argument and the token is never returned to the model.
const shared = {
  source: { url: "https://developers.itmplatform.com/documentation/openapi.json" },
  allowedOrigin: "https://api.itmplatform.com",
  securitySchemes: { tokenAuth: { type: "apiKey", in: "header", name: "Token" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const remove = (pointers: readonly string[]) => pointers.map((path) => ({ op: "remove" as const, path }));

export const v1Options = {
  ...shared,
  baseUrl: "https://api.itmplatform.com/company",
  patches: remove([...login, ...v2Operations]),
} satisfies OpenapiToolNamesOptions;

export const v2Options = {
  ...shared,
  baseUrl: "https://api.itmplatform.com/v2/company",
  patches: remove([...login, ...v1Operations]),
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; it lists the v1 tools, `v2Options` the rest.
export const options = v1Options;
