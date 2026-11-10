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

// Every NetSapiens platform runs on its own host (pbx.example.com, api.example.net). Credentials only ever go to
// that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your NetSapiens API host, for example api.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The NetSapiens server must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the server host, with no path.");
  return url.origin;
}

const netsapiens = defineProvider({
  name: "NetSapiens",
  auth: {
    // An API key (Bearer) created in the NetSapiens manager portal or through the API. The platform host is part
    // of the account, so the provider declares no static `hosts`; the router below only sends the key to the
    // account's own origin.
    apiKey: secrets({
      label: "API key",
      fields: object({ server: plain(string({ minLength: 1 })), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.server);
    const response = await fetch(`${origin}/ns-api/v2/apikeys/~`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: {
        externalId: `${origin}:${account.fields.apiKey.slice(0, 12)}`,
        displayName: new URL(origin).host,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { netsapiens: netsapiens.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.netsapiens ?? [],
        (account) => {
          const origin = originOf(account.fields.server);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/ns-api/v2`,
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
        title: "NetSapiens",
        description:
          "Domains, users, phone numbers, call queues, auto attendants, devices, messaging, call history, voicemail and the rest of the NetSapiens API v2.",
        instructions:
          "Each account is one NetSapiens platform. What a call may do depends on the scope of the API key (super user, reseller, office manager or user) and whether it is read-only.",
        icons,
      },
    ),
  }),
);
