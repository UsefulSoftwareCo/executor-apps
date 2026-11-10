import type { OpenapiToolNamesOptions } from "apps/openapi";
import { patches } from "./patches.ts";

// DocuSign's official eSignature REST API v2.1 Swagger document. It declares no security schemes;
// every operation accepts a bearer access token. The API lives on a per-account host (the
// `base_uri` from /oauth/userinfo, such as https://na3.docusign.net), so callers pass the origin.
export const productionHost = "https://www.docusign.net";
export const sandboxHost = "https://demo.docusign.net";

export const hostOptions = (origin: string) =>
  ({
    source: {
      url: "https://raw.githubusercontent.com/docusign/OpenAPI-Specifications/22a381c4e956b7cd18fb61a98590e859225df717/esignature.rest.swagger-v2.1.json",
    },
    allowedOrigin: origin,
    baseUrl: `${origin}/restapi`,
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ bearer: [] }],
    methods: {
      token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
      oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
      sandbox: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
    patches,
  }) satisfies OpenapiToolNamesOptions;

// Accepts https://<pod>.docusign.net (optionally with /restapi) and nothing else.
export const originOf = (baseUri: string) => {
  const match = /^(?:https:\/\/)?([a-z0-9][a-z0-9-]*\.docusign\.net)(?:\/restapi)?\/?$/.exec(
    baseUri.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter the base URI from /oauth/userinfo, such as https://na3.docusign.net.");
  return `https://${match[1]}`;
};

export const options = hostOptions(productionHost);
