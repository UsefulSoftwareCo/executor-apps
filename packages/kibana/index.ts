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
import { kibanaOptions, siteUrl } from "./openapi.js";

// Only `status.overall.level` is present in both the full and the redacted /api/status response
// (Kibana redacts the rest for callers without the `monitor` cluster privilege).
const Status = object({ status: object({ overall: object({ level: string() }) }) });

const kibana = defineProvider({
  name: "Kibana",
  // Deliberately no `hosts`: Kibana runs on Elastic Cloud (*.elastic-cloud.com) but also on any
  // self-managed domain. A hosts allow-list would refuse every self-managed account, and the
  // account URL is not known when the provider is declared. Consequence: app code receives the real
  // apiKey/password values; they are only sent to the origin the user entered (allowedOrigin).
  auth: {
    apiKey: secrets({
      label: "API key (encoded value)",
      fields: object({
        url: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
    basic: secrets({
      label: "Username and password",
      fields: object({
        url: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = siteUrl(account.fields.url);
    const authorization =
      account.method === "apiKey"
        ? `ApiKey ${account.fields.apiKey}`
        : `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`;
    const response = await fetch(`${base}/api/status`, {
      signal,
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    await decodeJson(response, Status);
    const host = new URL(base).host;
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { kibana: kibana.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kibana ?? [],
        (account) => {
          // Kibana rejects state-changing requests without the kbn-xsrf header.
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            headers.set("kbn-xsrf", "true");
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({ ...kibanaOptions(account.fields.url), cache, fetch: signed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Kibana",
        description:
          "Kibana dashboards, saved objects, spaces, alerting rules, connectors, data views, Fleet, Security and Observability on your own Kibana deployment.",
        icons,
      },
    ),
  }),
);
