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

// Every InfluxDB Cloud account lives on a region cluster such as us-east-1-1.aws.cloud2.influxdata.com,
// the first subdomain of your organization URL. Only influxdata.com hosts are accepted.
const hostPattern = /^[a-z0-9][a-z0-9.-]*\.influxdata\.com$/;

function clusterOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your InfluxDB Cloud URL, for example https://us-east-1-1.aws.cloud2.influxdata.com.");
  }
  if (url.protocol !== "https:" || !hostPattern.test(url.hostname))
    throw new Error("The InfluxDB Cloud URL must be an https *.influxdata.com host, for example us-east-1-1.aws.cloud2.influxdata.com.");
  return url.origin;
}

const influxdbcloud = defineProvider({
  name: "InfluxDB Cloud",
  hosts: ["*.influxdata.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        url: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = clusterOrigin(account.fields.url);
    const response = await fetch(`${origin}/api/v2/me`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ name: string() }));
    return { accountInfo: { externalId: `${new URL(origin).hostname}:${me.name}`, displayName: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { influxdbcloud: influxdbcloud.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.influxdbcloud ?? [],
        (account) => {
          const origin = clusterOrigin(account.fields.url);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v2`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "InfluxDB Cloud",
        description:
          "Query, write and manage time series data in InfluxDB Cloud: buckets, organizations, tasks, checks, notification rules, dashboards, tokens and more.",
        icons,
      },
    ),
  }),
);
