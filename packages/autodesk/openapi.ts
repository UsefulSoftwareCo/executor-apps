import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Autodesk Platform Services (APS) product, six official specs from
// https://github.com/autodesk-platform-services/aps-sdk-openapi. index.ts mounts each under its own key.
// All APIs live on developer.api.autodesk.com and take the 3-legged OAuth access token as a bearer token; the
// specs name their OAuth flows as separate schemes (2-legged is app-only), so each is declared as a bearer token and the user's 3-legged token is sent for all of them (APS accepts it on OSS and Webhooks too, given the scopes).
const spec = (path: string) => ({
  url: `https://raw.githubusercontent.com/autodesk-platform-services/aps-sdk-openapi/main/${path}`,
});

const api = (path: string) =>
  ({
    source: spec(path),
    allowedOrigin: "https://developer.api.autodesk.com",
    baseUrl: "https://developer.api.autodesk.com",
    securitySchemes: {
      "3-legged": { type: "http", scheme: "bearer" },
      "3-legged-implicit": { type: "http", scheme: "bearer" },
      "2-legged": { type: "http", scheme: "bearer" },
      oauth2_application: { type: "http", scheme: "bearer" },
    },
    fallbackSecurity: [{ "3-legged": [] }],
    methods: {
      oauth: [
        { scheme: "3-legged", field: "access_token", part: "value", prefix: "" },
        { scheme: "3-legged-implicit", field: "access_token", part: "value", prefix: "" },
        { scheme: "2-legged", field: "access_token", part: "value", prefix: "" },
        { scheme: "oauth2_application", field: "access_token", part: "value", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const dataManagementOptions = api("datamanagement/datamanagement.yaml");
export const ossOptions = api("oss/oss.yaml");
export const modelDerivativeOptions = api("modelderivative/modelderivative.yaml");
export const webhooksOptions = api("webhooks/webhooks.yaml");
export const issuesOptions = api("construction/issues/Issues.yaml");
export const accountAdminOptions = api("construction/accountadmin/accountadmin.yaml");

export const apis = {
  dataManagement: dataManagementOptions,
  oss: ossOptions,
  modelDerivative: modelDerivativeOptions,
  webhooks: webhooksOptions,
  issues: issuesOptions,
  accountAdmin: accountAdminOptions,
} as const;

// scripts/tools.ts reads `options`; Data Management is the main API.
export const options = dataManagementOptions;
