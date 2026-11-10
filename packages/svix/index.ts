import {
  accountRouter,
  defineApp,
  defineProvider,
  decodeJson,
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

const regions = ["us", "eu", "ca", "au"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error("Region must be one of: us, eu, ca, au.");
  return `https://api.${region}.svix.com`;
}

const svix = defineProvider({
  name: "Svix",
  hosts: regions.map((region) => `api.${region}.svix.com`),
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/api/v1/event-type?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { svix: svix.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.svix ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Svix",
        description:
          "Send webhooks with Svix: applications, endpoints, messages, event types, delivery attempts, integrations, streams and ingest sources.",
        instructions:
          "The account's region (us, eu, ca or au) selects the Svix server; use the region of the dashboard the API key was created in.",
        icons,
      },
    ),
  }),
);
