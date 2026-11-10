import type { OpenapiToolNamesOptions } from "apps/openapi";

// Platform API: model search, pricing, usage, API keys, assets, compute, serverless apps.
// Official OpenAPI 3.1 document linked from https://fal.ai/docs/api-reference/platform-apis/openapi-schema
const platformSchemes = {
  apiKey: { type: "apiKey", in: "header", name: "Authorization" },
  serverlessApiKey: { type: "apiKey", in: "header", name: "Authorization" },
  deployApiKey: { type: "apiKey", in: "header", name: "Authorization" },
  computeApiKey: { type: "apiKey", in: "header", name: "Authorization" },
  billingApiKey: { type: "apiKey", in: "header", name: "Authorization" },
  readonlyApiKey: { type: "apiKey", in: "header", name: "Authorization" },
  fullApiKey: { type: "apiKey", in: "header", name: "Authorization" },
} as const;

// fal wants the header value "Key <api key>".
const keyMethod = (scheme: string) => ({ scheme, field: "token", part: "value", prefix: "Key " }) as const;

export const options = {
  source: { url: "https://fal.ai/docs/api-reference/platform-apis/openapi/v1.json" },
  allowedOrigin: "https://api.fal.ai",
  securitySchemes: platformSchemes,
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: Object.keys(platformSchemes).map(keyMethod) },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// Queue API: submit a request to any model endpoint, poll status, fetch the result, cancel.
// Queue API: submit a request to any model endpoint, poll status, fetch the result, cancel.
// fal puts the whole endpoint id, slashes included, in the URL path (queue.fal.run/fal-ai/flux/dev),
// but the document declares endpoint_id as a plain path parameter, which the runtime would encode as
// fal-ai%2Fflux%2Fdev. The patches mark it allowReserved so slashes stay raw, and give the
// operations (which have no operationId) readable tool names.
const endpointId = {
  name: "endpoint_id",
  in: "path",
  required: true,
  allowReserved: true,
  schema: { type: "string", description: "Endpoint ID, for example fal-ai/flux/dev" },
};
const requestId = {
  name: "request_id",
  in: "path",
  required: true,
  schema: { type: "string", description: "Request ID" },
};

type PatchValue = NonNullable<NonNullable<OpenapiToolNamesOptions["patches"]>[number]["value"]>;
// The patch value type only admits objects at the top level; the runtime accepts arrays.
const parameters = (...items: readonly object[]) => items as unknown as PatchValue;

export const queueOptions = {
  source: { url: "https://fal.ai/api/openapi/queue/openapi.json" },
  allowedOrigin: "https://queue.fal.run",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ apiKeyAuth: [] }],
  methods: { apiKey: [keyMethod("apiKeyAuth")] },
  oauth: [],
  patches: [
    {
      op: "replace",
      path: "/paths/~1{endpoint_id}/post/parameters",
      value: parameters(
        {
          name: "X-Fal-Queue-Priority",
          in: "header",
          required: false,
          schema: {
            type: "string",
            description: "The priority of the request.",
            enum: ["low", "normal", "high"],
          },
        },
        {
          name: "fal_webhook",
          in: "query",
          required: false,
          schema: { type: "string", description: "The webhook to call when the request is completed." },
        },
        endpointId,
      ),
    },
    {
      op: "replace",
      path: "/paths/~1{endpoint_id}~1requests~1{request_id}~1status/get/parameters",
      value: parameters(
        requestId,
        {
          name: "logs",
          in: "query",
          required: false,
          schema: { type: "number", description: "Whether to include logs (`1`) in the response or not (`0`)." },
        },
        endpointId,
      ),
    },
    { op: "replace", path: "/paths/~1{endpoint_id}~1requests~1{request_id}/get/parameters", value: parameters(requestId, endpointId) },
    {
      op: "replace",
      path: "/paths/~1{endpoint_id}~1requests~1{request_id}~1cancel/put/parameters",
      value: parameters(requestId, endpointId),
    },
    { op: "add", path: "/paths/~1{endpoint_id}/post/operationId", value: "queueSubmit" },
    { op: "add", path: "/paths/~1{endpoint_id}~1requests~1{request_id}~1status/get/operationId", value: "queueStatus" },
    { op: "add", path: "/paths/~1{endpoint_id}~1requests~1{request_id}/get/operationId", value: "queueResult" },
    { op: "add", path: "/paths/~1{endpoint_id}~1requests~1{request_id}~1cancel/put/operationId", value: "queueCancel" },
  ],
} satisfies OpenapiToolNamesOptions;
