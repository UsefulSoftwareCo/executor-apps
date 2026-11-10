import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Every Trackdesk program lives on its own host: https://<tenantId>.trackdesk.com.
function normalizeTenant(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.trackdesk\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null)
    throw new Error("Enter the tenant ID: the <tenantId> of https://<tenantId>.trackdesk.com (letters, digits, hyphens).");
  return match[1]!;
}

const trackdesk = defineProvider({
  name: "Trackdesk",
  hosts: ["*.trackdesk.com"],
  auth: {
    // Personal access tokens: program > your name > Settings > Integrations > Personal access tokens.
    // Trackdesk's OAuth2 endpoints are per tenant, which the framework cannot declare statically.
    apiKey: secrets({
      label: "Personal access token",
      fields: object({
        tenantId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const tenant = normalizeTenant(account.fields.tenantId);
    const response = await fetch(`https://${tenant}.trackdesk.com/api/node/payment-method-types/v1/supported`, {
      signal,
      headers: { "X-Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: tenant, displayName: `${tenant}.trackdesk.com` } };
  },
});

export default defineApp(
  { user: { accounts: { trackdesk: trackdesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.trackdesk ?? [],
        (account) => {
          const origin = `https://${normalizeTenant(account.fields.tenantId)}.trackdesk.com`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Trackdesk",
        description:
          "Trackdesk affiliate platform: affiliates, offers, conversions, billing and settlements, tags, tiers, bonuses and webhooks.",
        instructions:
          "Each account is one Trackdesk program (tenant). API access depends on the program's plan including the public API.",
        icons,
      },
    ),
  }),
);
