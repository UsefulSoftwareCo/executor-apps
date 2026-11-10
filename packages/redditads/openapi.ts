import type { OpenapiToolNamesOptions } from "apps/openapi";

// Reddit's own OpenAPI 3.1 document for the Ads API v3. Its only scheme is the oauth2 "RedditAPIKey".
export const options = {
  source: { url: "https://ads-api.reddit.com/api/v3/openapi.json" },
  allowedOrigin: "https://ads-api.reddit.com",
  securitySchemes: {
    RedditAPIKey: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://www.reddit.com/api/v1/authorize",
          tokenUrl: "https://www.reddit.com/api/v1/access_token",
          scopes: {},
        },
      },
    },
  },
  methods: {},
  oauth: ["RedditAPIKey"],
  // The three data-deletion operations need the adsdatadeletion scope, which is not requested, so they are removed.
  patches: [
    { op: "remove", path: "/paths/~1ad_accounts~1{ad_account_id}~1data_deletion_jobs" },
    { op: "remove", path: "/paths/~1data_deletion_jobs~1{job_id}" },
    { op: "remove", path: "/paths/~1pixels~1{pixel_id}~1data_deletion_jobs" },
  ],
  fallbackSecurity: [{ RedditAPIKey: [] as string[] }] as { [x: string]: string[] }[],
} satisfies OpenapiToolNamesOptions;
