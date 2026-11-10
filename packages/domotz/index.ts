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
import { options, originOf } from "./openapi.js";

const hostOf = (value: string) => {
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  if (/^api-[a-z0-9-]+\.domotz\.com$/.test(host)) return host;
  throw new Error("Endpoint must be a Domotz API host such as api-eu-west-1-cell-1.domotz.com.");
};

const domotz = defineProvider({
  name: "Domotz",
  hosts: ["*.domotz.com"],
  auth: {
    // Domotz Portal > Settings > Services > API Keys. The endpoint is shown with the key when it is created.
    apiKey: secrets({
      label: "Endpoint host and API key",
      fields: object({
        host: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = hostOf(account.fields.host);
    const response = await fetch(`${originOf(host)}/user`, {
      signal,
      headers: { "X-Api-Key": account.fields.apiKey, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: host, displayName: `Domotz (${host})` } };
  },
});

export default defineApp(
  { user: { accounts: { domotz: domotz.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.domotz ?? [],
        (account) => {
          const host = hostOf(account.fields.host);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: `https://${host}`,
              baseUrl: originOf(host),
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
        title: "Domotz",
        description:
          "Monitor and manage networks with Domotz: collectors, devices, alerts and alert rules, organizations, custom tags and drivers, and audit logs.",
        icons,
      },
    ),
  }),
);
