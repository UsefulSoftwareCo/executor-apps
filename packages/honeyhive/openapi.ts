import type { OpenapiToolNamesOptions } from "apps/openapi";

// HoneyHive publishes two official OpenAPI 3.1 documents in https://github.com/honeyhiveai/honeyhive-openapi:
// the Data Plane (events, datasets, metrics, runs...) and the Control Plane (projects, workspaces, alerts).
// They live on different hosts and take different key types, so index.ts mounts each under its own key.
const SPEC = "https://raw.githubusercontent.com/honeyhiveai/honeyhive-openapi/43ad8a888736482b7eb655ab3a33441be4dd9a64/data_plane_openapi.json";
const dataPlane = {
  source: { url: SPEC },
  allowedOrigin: "https://api.dp1.us.honeyhive.ai",
  baseUrl: "https://api.dp1.us.honeyhive.ai",
  oauth: [],
} as const;

// Each key type is only accepted by the operations that list its scheme, so each
// method gets its own router mounting only those operations (project key: 58
// BearerAuth, fine-grained key: 10 DataPlaneApiKey, ingestion key: 12 IngestionApiKey).
export const projectOptions = {
  ...dataPlane,
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { projectKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
} satisfies OpenapiToolNamesOptions;

export const fineGrainedOptions = {
  ...dataPlane,
  securitySchemes: { DataPlaneApiKey: { type: "http", scheme: "bearer" } },
  methods: { dataPlaneKey: [{ scheme: "DataPlaneApiKey", field: "token", part: "value", prefix: "" }] },
} satisfies OpenapiToolNamesOptions;

export const ingestionOptions = {
  ...dataPlane,
  securitySchemes: { IngestionApiKey: { type: "http", scheme: "bearer" } },
  methods: { ingestionKey: [{ scheme: "IngestionApiKey", field: "token", part: "value", prefix: "" }] },
} satisfies OpenapiToolNamesOptions;

export const controlPlaneOptions = {
  source: { url: "https://raw.githubusercontent.com/honeyhiveai/honeyhive-openapi/43ad8a888736482b7eb655ab3a33441be4dd9a64/control_plane_openapi.json" },
  allowedOrigin: "https://api.cp.us.honeyhive.ai",
  baseUrl: "https://api.cp.us.honeyhive.ai",
  securitySchemes: { ControlPlaneApiKey: { type: "http", scheme: "bearer" } },
  methods: {
    controlPlaneKey: [{ scheme: "ControlPlaneApiKey", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; the project key has the largest surface.
export const options = projectOptions;
