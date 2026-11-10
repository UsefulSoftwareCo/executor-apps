import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api-engineering.nyc3.cdn.digitaloceanspaces.com/spec-ci/DigitalOcean-public.v2.yaml" },
  allowedOrigin: "https://api.digitalocean.com",
  securitySchemes: { bearer_auth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "bearer_auth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer_auth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Serverless inference and agent endpoints live on other origins (inference.do-ai.run, per-agent
  // hosts) with their own model access keys; they are not part of the api.digitalocean.com API.
  patches: [
    { op: "remove", path: "/paths/~1v1~1chat~1completions" },
    { op: "remove", path: "/paths/~1v1~1messages" },
    { op: "remove", path: "/paths/~1v1~1embeddings" },
    { op: "remove", path: "/paths/~1api~1v1~1chat~1completions" },
    { op: "remove", path: "/paths/~1v1~1images~1generations" },
    { op: "remove", path: "/paths/~1v1~1models" },
    { op: "remove", path: "/paths/~1v1~1systemone" },
    { op: "remove", path: "/paths/~1v1~1responses" },
    { op: "remove", path: "/paths/~1v1~1async-invoke" },
    { op: "remove", path: "/paths/~1v1~1batches~1files" },
    { op: "remove", path: "/paths/~1<upload_url>" },
    { op: "remove", path: "/paths/~1v1~1batches" },
    { op: "remove", path: "/paths/~1v1~1batches~1{batch_id}" },
    { op: "remove", path: "/paths/~1v1~1batches~1{batch_id}~1results" },
    { op: "remove", path: "/paths/~1v1~1batches~1{batch_id}~1cancel" },
  ],
} satisfies OpenapiToolNamesOptions;
