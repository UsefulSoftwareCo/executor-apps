import { accountRouter, defineApp, defineProvider, oauth2, router, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const knocommerce = defineProvider({
  name: "Kno Commerce",
  hosts: ["app-api.knocommerce.com", "api.knocommerce.com"],
  auth: {
    // Settings > API Access in the Kno dashboard: a Client ID and Client Secret, exchanged for a bearer token.
    // Kno reads grant_type and scope from the query string of the token request.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl:
        "https://api.knocommerce.com/api/oauth2/token?grant_type=client_credentials&scope=SURVEYS+RESPONSES+WEBHOOKS+QUESTIONS+ATTRIBUTION",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["SURVEYS", "RESPONSES", "WEBHOOKS", "QUESTIONS", "ATTRIBUTION"],
      scopeSeparator: " ",
    }),
  },
  // Read-only call that checks the token, the SURVEYS scope and plan access.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app-api.knocommerce.com/api/rest/surveys?pageSize=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Kno Commerce health check failed: HTTP ${response.status}`);
    return { accountInfo: { externalId: "knocommerce", displayName: "Kno Commerce" } };
  },
});

export default defineApp(
  { user: { accounts: { knocommerce: knocommerce.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.knocommerce ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kno Commerce",
        description: "Kno Commerce post-purchase surveys: surveys, responses, webhook subscriptions, benchmark questions and attribution.",
        icons,
      },
    ),
  }),
);
