import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apiOptions, legacyOptions } from "./openapi.js";

const ipinfo = defineProvider({
  name: "IPinfo",
  hosts: ["api.ipinfo.io", "ipinfo.io"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ipinfo.io/lite/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ ip: string() }));
  },
});

export default defineApp(
  { user: { accounts: { ipinfo: ipinfo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ipinfo ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          // Two origins serve one document: api.ipinfo.io (Lite, Lookup, places, batch, tools) and
          // ipinfo.io (the legacy /{ip} routes).
          return router(
            {
              api: approve(liveOpenapiRouter({ ...apiOptions, cache, fetch, signal, account })),
              legacy: approve(liveOpenapiRouter({ ...legacyOptions, cache, fetch, signal, account })),
            },
            { title: "IPinfo", description: "IPinfo API." },
          );
        },
        { signal },
      ),
      {
        title: "IPinfo",
        description: "IP intelligence from IPinfo: geolocation, ASN, company, carrier, privacy and proxy detection, ranges, hosted domains and WHOIS.",
        icons,
      },
    ),
  }),
);
