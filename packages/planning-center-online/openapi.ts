import type { OpenapiToolNamesOptions } from "apps/openapi";

// Planning Center publishes one official OpenAPI 3.1 description per product, served unauthenticated by the API
// itself at https://api.planningcenteronline.com/<product>/v2/open_api/<version> (listed in each product's
// /<product>/v2/documentation). Each document declares its own server (/<product>/v2), an oauth2 scheme and a
// personal access token sent as HTTP Basic (Client ID as username, Secret as password). One package mounts them all.
const origin = "https://api.planningcenteronline.com";

const api = (product: string, version: string) =>
  ({
    source: { url: `${origin}/${product}/v2/open_api/${version}` },
    allowedOrigin: origin,
    securitySchemes: {
      oauth2: {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: `${origin}/oauth/authorize`,
            tokenUrl: `${origin}/oauth/token`,
            scopes: {},
          },
        },
      },
      personal_access_token: { type: "http", scheme: "basic" },
    },
    methods: {
      personalAccessToken: [
        { scheme: "personal_access_token", field: "appId", part: "username", prefix: "" },
        { scheme: "personal_access_token", field: "secret", part: "password", prefix: "" },
      ],
    },
    oauth: ["oauth2"],
  }) satisfies OpenapiToolNamesOptions;

export const peopleOptions = api("people", "2026-10-05");
export const servicesOptions = api("services", "2018-11-01");
export const givingOptions = api("giving", "2019-10-18");
export const calendarOptions = api("calendar", "2026-06-22");
export const checkInsOptions = api("check-ins", "2025-05-28");
export const groupsOptions = api("groups", "2023-07-10");
export const publishingOptions = api("publishing", "2024-03-25");
export const registrationsOptions = api("registrations", "2025-05-01");
export const webhooksOptions = api("webhooks", "2022-10-20");

export const allOptions = {
  people: peopleOptions,
  services: servicesOptions,
  giving: givingOptions,
  calendar: calendarOptions,
  checkIns: checkInsOptions,
  groups: groupsOptions,
  publishing: publishingOptions,
  registrations: registrationsOptions,
  webhooks: webhooksOptions,
};

// scripts/tools.ts reads `options`; it checks the largest product.
export const options = peopleOptions;
