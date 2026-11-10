import type { OpenapiToolNamesOptions } from "apps/openapi";

// Zoom publishes one OpenAPI document per product at a stable URL. All are served from
// https://api.zoom.us, so each becomes its own router. Keys are the URL slugs.
const root = "https://developers.zoom.us/api-hub";

const specs = {
  meetings: "meetings",
  users: "users",
  accounts: "accounts",
  phone: "phone",
  chat: "chat",
  rooms: "rooms",
  events: "events",
  calendar: "calendar",
  mail: "mail",
  whiteboard: "whiteboard",
  scheduler: "scheduler",
  contactCenter: "contact-center",
  clips: "clips",
  numberManagement: "number-management",
  videoSdk: "video-sdk",
  scim2: "scim2",
  qualityManagement: "quality-management",
  workforceManagement: "workforce-management",
  autoDialer: "auto-dialer",
  tasks: "tasks",
  marketplace: "marketplace",
  commerce: "commerce",
  healthcare: "healthcare",
  qss: "qss",
  virtualAgent: "virtual-agent",
  iq: "iq",
  aiServices: "ai-services",
  chatbot: "chatbot",
  hub: "hub",
} as const;

// The documents declare an apiKey "Authorization" header scheme and an OAuth scheme with empty
// URLs. Zoom OAuth access tokens are sent as "Authorization: Bearer <token>", so both are
// redeclared as bearer.
const common = {
  allowedOrigin: "https://api.zoom.us",
  securitySchemes: {
    openapi_authorization: { type: "http", scheme: "bearer" },
    openapi_oauth: { type: "http", scheme: "bearer" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: ["openapi_authorization", "openapi_oauth", "bearer"].map((scheme) => ({
      scheme,
      field: "access_token",
      part: "value" as const,
      prefix: "",
    })),
  },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

export const sources: Record<string, OpenapiToolNamesOptions> = Object.fromEntries(
  Object.entries(specs).map(([key, slug]) => [
    key,
    { ...common, source: { url: `${root}/${slug}/methods/endpoints.json` } },
  ]),
);

// scripts/tools.ts checks this one.
export const options = sources.meetings satisfies OpenapiToolNamesOptions;
