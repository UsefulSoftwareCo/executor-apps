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
import { specs } from "./openapi.js";

const origins = {
  us: "https://api.integrator.io",
  eu: "https://api.eu.integrator.io",
  au: "https://api.au.integrator.io",
  ca: "https://api.ca.integrator.io",
} as const;

function origin(account: { fields: { region: string } }) {
  const key = account.fields.region.trim().toLowerCase();
  if (key !== "us" && key !== "eu" && key !== "au" && key !== "ca") {
    throw new Error("Enter the region of your Celigo account: us, eu, au or ca.");
  }
  return origins[key];
}

const celigo = defineProvider({
  name: "Celigo",
  hosts: Object.values(origins).map((url) => new URL(url).host),
  auth: {
    apiKey: secrets({
      label: "Region and API token",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Any valid token can introspect itself.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/v1/tokenInfo`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { celigo: celigo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.celigo ?? [],
        (account) => {
          const base = origin(account);
          const entries = Object.entries(specs).map(([key, options]) => [
            key,
            withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          ]);
          return router(Object.fromEntries(entries), { title: "Celigo", description: "Celigo account." });
        },
        { signal },
      ),
      {
        title: "Celigo",
        description:
          "Celigo integrator.io iPaaS. Mounted by resource: integration, flow, export, import, connection, job, script, stack, tag, user, ediprofile, editransaction, aiAgent, mcpServer, httpconnector and more.",
        icons,
      },
    ),
  }),
);
