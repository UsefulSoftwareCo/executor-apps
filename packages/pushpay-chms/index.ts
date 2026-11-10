import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// The spec marks no field of /me as required, so nothing is decoded from it beyond a valid JSON object.
const Me = object({});

const accept = "application/vnd.ccbchurch.v2+json";

const pushpayChms = defineProvider({
  name: "Pushpay ChMS",
  hosts: ["api.ccbchurch.com", "oauth.ccbchurch.com"],
  auth: {
    // The OAuth app comes from Pushpay's partner program; its client is entered on the connect page.
    // No scopes are sent, so the church admin authorizes every scope the app was granted.
    oauth: oauth2({
      authorizationUrl: "https://oauth.ccbchurch.com/oauth/authorize",
      tokenUrl: "https://api.ccbchurch.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ccbchurch.com/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: accept },
    });
    // decodeJson throws on a non-2xx status or a non-JSON body. The spec marks no /me field as required,
    // so no id is read and the account has no externalId.
    await decodeJson(response, Me);
    return { accountInfo: { displayName: "Pushpay ChMS" } };
  },
});

export default defineApp(
  { user: { accounts: { pushpayChms: pushpayChms.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    // Every request must send the v2 media type in Accept.
    const versionedFetch: typeof fetch = (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("Accept", accept);
      return fetch(input, { ...init, headers });
    };
    return {
      tools: router(
        await accountRouter(
          user?.accounts.pushpayChms ?? [],
          (account) =>
            withApprovals(
              liveOpenapiRouter({ ...options, cache, fetch: versionedFetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        {
          title: "Pushpay ChMS",
          description:
            "Church management (formerly Church Community Builder): individuals, families, groups, events, scheduling, forms, processes, needs, notes, campuses and church settings.",
          icons,
        },
      ),
    };
  },
);
