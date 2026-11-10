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

// Hex hosts: app (multi-tenant), eu, hc (HIPAA) or a single-tenant name.
function originFor(raw: string): string {
  const subdomain = raw.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain))
    throw new Error("Subdomain must be app, eu, hc or your single-tenant name (letters, digits, hyphens).");
  return `https://${subdomain}.hex.tech`;
}

const hex = defineProvider({
  name: "Hex",
  hosts: ["*.hex.tech"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.subdomain)}/api/v1/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { hex: hex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hex ?? [],
        (account) => {
          const origin = originFor(account.fields.subdomain);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Hex",
        description: "Run and manage Hex projects, runs, cells, threads, collections, groups, data connections, users and suggestions.",
        instructions:
          "The account's subdomain is app (default multi-tenant), eu, hc (HIPAA) or your single-tenant name, matching the host in your Hex URL.",
        icons,
      },
    ),
  }),
);
