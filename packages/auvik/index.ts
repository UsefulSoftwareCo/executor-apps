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

// Every Auvik tenant lives in one region: https://auvikapi.<region>.my.auvik.com (us1, us2, eu1, ...).
function normalizeRegion(raw: string): string {
  const match = /^(?:https?:\/\/)?(?:auvikapi\.)?([a-z]{2}[0-9]+)(?:\.my\.auvik\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter your Auvik region, such as us1, us2 or eu1.");
  return match[1]!;
}

const auvik = defineProvider({
  name: "Auvik",
  hosts: ["*.my.auvik.com"],
  auth: {
    // Auvik uses HTTP Basic: the username is the Auvik user's email and the password is an API key
    // generated for that user (Admin > Integrations > Auvik API keys). There is no OAuth.
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const region = normalizeRegion(account.fields.region);
    const response = await fetch(`https://auvikapi.${region}.my.auvik.com/v1/authentication/verify`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.apiKey}`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: `${region}:${account.fields.username}`, displayName: `${account.fields.username} (${region})` } };
  },
});

export default defineApp(
  { user: { accounts: { auvik: auvik.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.auvik ?? [],
        (account) => {
          const origin = `https://auvikapi.${normalizeRegion(account.fields.region)}.my.auvik.com`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Auvik",
        description:
          "Network monitoring and management in Auvik: devices, networks, interfaces, configurations, alerts, tenants, statistics and SaaS management.",
        instructions: "Most list endpoints need a tenants filter (filter[tenants]); call the tenants tools first to find tenant ids.",
        icons,
      },
    ),
  }),
);
