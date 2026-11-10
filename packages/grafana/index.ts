import {
  accountRouter,
  bearer,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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
import { grafanaOptions, siteUrl } from "./openapi.js";

const grafana = defineProvider({
  name: "Grafana",
  hosts: ["*.grafana.net"],
  auth: {
    serviceAccountToken: secrets({
      label: "Service account token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => bearer(token),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = siteUrl(account.fields.domain);
    const response = await fetch(account.url(`${base}/api/org`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const org = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: `${new URL(base).hostname}/${org.id}`, displayName: org.name } };
  },
});

export default defineApp(
  { user: { accounts: { grafana: grafana.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.grafana ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({ ...grafanaOptions(account.fields.domain), cache, fetch: signed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Grafana",
        description: "Grafana Cloud dashboards, folders, data sources, alerting, annotations, teams, users and service accounts.",
        icons,
      },
    ),
  }),
);
