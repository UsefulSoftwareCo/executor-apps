import { accountRouter, decodeJson, defineApp, defineProvider, oauth2, object, router, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const zoominfo = defineProvider({
  name: "ZoomInfo",
  hosts: ["api.zoominfo.com"],
  auth: {
    // ZoomInfo offers no client registration: the connect page asks for the client of an app created in the
    // ZoomInfo DevPortal. It uses the authorization code flow with PKCE; scopes come from the app's own settings,
    // because an authorize request without a scope receives every scope the app was created with.
    oauth: oauth2({
      authorizationUrl: "https://api.zoominfo.com/gtm/oauth/v1/authorize",
      tokenUrl: "https://api.zoominfo.com/gtm/oauth/v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // Reads the caller's own API usage, which every Data API scope allows.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.zoominfo.com/gtm/data/v1/users/usage", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { zoominfo: zoominfo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zoominfo ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(
              liveOpenapiRouter({ ...options, baseUrl: "https://api.zoominfo.com/gtm", cache, fetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            {
              data: mount(apis.data),
              copilot: mount(apis.copilot),
              agent: mount(apis.agent),
              gtmStudio: mount(apis.gtmStudio),
              dataQuality: mount(apis.dataQuality),
              marketing: mount(apis.marketing),
              platform: mount(apis.platform),
              verticalDatasets: mount(apis.verticalDatasets),
            },
            { title: "ZoomInfo", description: "ZoomInfo." },
          );
        },
        { signal },
      ),
      {
        title: "ZoomInfo",
        description:
          "ZoomInfo. data: search and enrich companies, contacts, intent, news, scoops, technologies, org charts and lookup values. copilot: account summaries, insights, lookalikes, contact recommendations and GTM configuration. agent: ZoomInfo agents and their runs. gtmStudio: GTM Studio audiences, columns and rows. dataQuality: normalize, score and segment configurations. marketing: marketing audiences. platform: engagements and data exports. verticalDatasets: financial filings, job posts, loan statements and product reviews.",
        icons,
      },
    ),
  }),
);
