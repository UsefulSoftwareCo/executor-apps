import type { OpenapiToolNamesOptions } from "apps/openapi";
import securedOperations from "./secured-operations.json" with { type: "json" };

// Onshape's document lists OAuth2 and BasicAuth inside one security requirement object, which
// means "both at once" and no account can satisfy it. Every operation accepts either, so each
// secured operation is patched to offer them as alternatives. secured-operations.json lists the
// [path, method] pairs that carry a security requirement in https://cad.onshape.com/api/openapi.
const pointer = (segment: string) => segment.replaceAll("~", "~0").replaceAll("/", "~1");

const either: { [scheme: string]: string[] }[] = [{ BasicAuth: [] }, { OAuth2: [] }];

export const options = {
  source: { url: "https://cad.onshape.com/api/openapi" },
  allowedOrigin: "https://cad.onshape.com",
  securitySchemes: {
    BasicAuth: { type: "http", scheme: "basic" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: either,
  patches: (securedOperations as [string, string][]).map(([path, method]) => ({
    op: "replace" as const,
    path: `/paths/${pointer(path)}/${method}/security`,
    value: either,
  })),
  methods: {
    apiKey: [
      { scheme: "BasicAuth", field: "accessKey", part: "username", prefix: "" },
      { scheme: "BasicAuth", field: "secretKey", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
