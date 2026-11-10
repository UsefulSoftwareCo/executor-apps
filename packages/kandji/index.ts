import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

// Every tenant lives on its own host: https://<subdomain>.api.kandji.io (US) or
// https://<subdomain>.api.eu.kandji.io (EU).
function apiOrigin(subdomainRaw: string, regionRaw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.api(?:\.eu)?\.kandji\.io)?\/?$/.exec(
    subdomainRaw.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter your tenant subdomain (letters, digits, hyphens).");
  const region = regionRaw.trim().toLowerCase();
  if (region !== "us" && region !== "eu") throw new Error('Region must be "us" or "eu".');
  return `https://${match[1]}.api${region === "eu" ? ".eu" : ""}.kandji.io`;
}

const kandji = defineProvider({
  name: "Kandji",
  hosts: ["*.api.kandji.io", "*.api.eu.kandji.io"],
  auth: {
    // Settings > Access > API Token > Add Token; grant the permissions the tools need.
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = apiOrigin(account.fields.subdomain, account.fields.region);
    const response = await fetch(`${origin}/api/v1/blueprints?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: {
        externalId: new URL(origin).hostname,
        displayName: new URL(origin).hostname,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { kandji: kandji.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kandji ?? [],
        (account) => {
          const origin = apiOrigin(account.fields.subdomain, account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Kandji",
        description:
          "Manage Apple devices in Kandji (now Iru Endpoint Management): devices, blueprints, library items, ADE, users, tags, vulnerabilities and audit events.",
        instructions: 'Set region to "us" or "eu" to match the tenant. Results depend on the API token permissions.',
        icons,
      },
    ),
  }),
);
