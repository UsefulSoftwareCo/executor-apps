import type { OpenapiToolNamesOptions } from "apps/openapi";

// One HighLevel product, many official specs from https://github.com/GoHighLevel/highlevel-api-docs/tree/main/apps.
// index.ts mounts each under its own key. Every operation accepts a bearer token (OAuth access token or Private
// Integration Token); the specs declare several identical bearer schemes, all bound to the same credential.
// Pinned to a commit of the official repository so the tool set does not change underneath us; bump it deliberately.
const revision = "0af86a4cbd48c66a4071c7e509d1079f9f10ed17";
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/GoHighLevel/highlevel-api-docs/${revision}/apps/${name}.json`,
});

const schemeNames = ["bearer", "Location-Access", "Location-Access-Only", "Agency-Access", "Agency-Access-Only"] as const;
const securitySchemes = Object.fromEntries(
  schemeNames.map((name) => [name, { type: "http", scheme: "bearer" } as const]),
) as Record<(typeof schemeNames)[number], { type: "http"; scheme: "bearer" }>;
const bind = (field: string) => schemeNames.map((scheme) => ({ scheme, field, part: "value", prefix: "" }) as const);

const api = (name: string) =>
  ({
    source: spec(name),
    allowedOrigin: "https://services.leadconnectorhq.com",
    securitySchemes,
    fallbackSecurity: [{ bearer: [] }],
    methods: {
      token: bind("token"),
      oauth: bind("access_token"),
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// Router key to spec file. The oauth spec (token exchange) is left out: Executor does that itself.
export const specs = {
  adManager: "ad-manager",
  affiliateManager: "affiliate-manager",
  agentStudio: "agent-studio",
  associations: "associations",
  blogs: "blogs",
  brandBoards: "brand-boards",
  businesses: "businesses",
  calendars: "calendars",
  campaigns: "campaigns",
  companies: "companies",
  contacts: "contacts",
  conversationAi: "conversation-ai",
  conversations: "conversations",
  courses: "courses",
  customFields: "custom-fields",
  customMenus: "custom-menus",
  emailIsv: "email-isv",
  emails: "emails",
  forms: "forms",
  funnels: "funnels",
  invoices: "invoices",
  knowledgeBase: "knowledge-base",
  links: "links",
  locations: "locations",
  marketplace: "marketplace",
  medias: "medias",
  objects: "objects",
  opportunities: "opportunities",
  payments: "payments",
  phoneSystem: "phone-system",
  products: "products",
  proposals: "proposals",
  saas: "saas-api",
  snapshots: "snapshots",
  socialPlanner: "social-media-posting",
  store: "store",
  surveys: "surveys",
  users: "users",
  voiceAi: "voice-ai",
  workflows: "workflows",
} as const;

export const apis = Object.fromEntries(Object.entries(specs).map(([key, file]) => [key, api(file)])) as {
  [K in keyof typeof specs]: ReturnType<typeof api>;
};

// scripts/tools.ts reads `options`; it checks the largest spec, and every spec compiles the same way.
export const options = apis.contacts;
