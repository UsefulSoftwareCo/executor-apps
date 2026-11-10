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
import { apis } from "./openapi.js";

const PbxList = object({ type: string() });

// The PBX domain is the customer's subdomain of wildixin.com. Accept "my-pbx" or "my-pbx.wildixin.com" and
// refuse anything else, so the key is only ever sent to a wildixin.com host.
function pbxOrigin(raw: string): string {
  const text = raw.trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/+$/, "");
  const label = text.endsWith(".wildixin.com") ? text.slice(0, -".wildixin.com".length) : text;
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(label)) {
    throw new Error("Enter your Wildix PBX domain, for example my-pbx or my-pbx.wildixin.com.");
  }
  return `https://${label}.wildixin.com`;
}

const wildix = defineProvider({
  name: "Wildix PBX",
  hosts: ["*.wildixin.com", "*.wildix.com", "*.wim.wildix.com", "api.x-bees.com"],
  auth: {
    // A Company API key (PBX 7.09 and later), sent as a bearer token. Its scopes decide which tools work.
    apiKey: secrets({
      label: "PBX domain and Company API key",
      fields: object({ domain: plain(string({ minLength: 1 })), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = pbxOrigin(account.fields.domain);
    // GET /api/v1/network/pbxes/ on the account's own PBX: a read-only WMS call that takes the Company API key.
    const response = await fetch(`${origin}/api/v1/network/pbxes/`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}`, Accept: "application/json" },
    });
    await decodeJson(response, PbxList);
    return { accountInfo: { externalId: origin, displayName: new URL(origin).hostname, profileUrl: origin } };
  },
});

export default defineApp(
  { user: { accounts: { wildix: wildix.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wildix ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis], origin?: string) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                ...(origin === undefined ? {} : { allowedOrigin: origin, baseUrl: origin }),
                cache,
                fetch,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router({
            pbx: mount(apis.wms, pbxOrigin(account.fields.domain)),
            apiKeys: mount(apis.apiKeys),
            analyticsHistory: mount(apis.analyticsHistory),
            analyticsInsights: mount(apis.analyticsInsights),
            analyticsStream: mount(apis.analyticsStream),
            conversations: mount(apis.conversations),
            users: mount(apis.users),
            kite: mount(apis.kite),
            assistant: mount(apis.assistant),
            voicebots: mount(apis.voicebots),
            integrations: mount(apis.integrations),
            knowledgeBase: mount(apis.knowledgeBase),
          });
        },
        { signal },
      ),
      {
        title: "Wildix PBX",
        description:
          "Wildix PBX management and call control, call history and analytics, x-bees conversations and users, Kite widgets, voicebots, knowledge bases and Company API keys.",
        instructions:
          "The pbx tools run on the account's own PBX domain; the others run on Wildix cloud services. What a call may do depends on the scopes of the Company API key.",
        icons,
      },
    ),
  }),
);
