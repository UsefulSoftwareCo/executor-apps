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
import { options } from "./openapi.js";

const whoisfreaks = defineProvider({
  name: "WhoisFreaks",
  hosts: ["api.whoisfreaks.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The account usage endpoint lists no credit cost on the vendor's Credit Usage page.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.whoisfreaks.com/v1.0/whoisapi/usage?${new URLSearchParams({ apiKey: account.fields.token })}`,
      { signal },
    );
    await decodeJson(response, object({ apiKey: string() }));
  },
});

export default defineApp(
  { user: { accounts: { whoisfreaks: whoisfreaks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.whoisfreaks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WhoisFreaks",
        description:
          "Domain and IP intelligence: live, historical and reverse WHOIS, DNS, SSL certificates, domain availability, typosquatting, subdomains, IP geolocation, and IP and domain reputation.",
        icons,
      },
    ),
  }),
);
