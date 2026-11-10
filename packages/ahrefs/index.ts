import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const ahrefs = defineProvider({
  name: "Ahrefs",
  hosts: ["api.ahrefs.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Ahrefs Connect: the connect page asks for the client created under Account settings > Ahrefs Connect.
    oauth: oauth2({
      authorizationUrl: "https://app.ahrefs.com/web/oauth/authorize",
      tokenUrl: "https://ahrefs.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["apiv3-integration-apps"],
    }),
  },
  // Free endpoint that consumes no API units.
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.ahrefs.com/v3/subscription-info/limits-and-usage", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ahrefs: ahrefs.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ahrefs ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ahrefs",
        description:
          "Ahrefs SEO data: Site Explorer, Keywords Explorer, SERP overview, Rank Tracker, Site Audit, Brand Radar and Web Analytics.",
        icons,
      },
    ),
  }),
);
