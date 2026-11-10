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

// Keys are `bk_{region}_...` (workspace) or `bm_{region}_...` (organization master); the prefix selects the host.
const regions = ["us1", "eu1"];

function origin(token: string) {
  const region = /^b[km]_([a-z0-9]+)_/.exec(token.trim())?.[1];
  if (region === undefined || !regions.includes(region)) {
    throw new Error("Enter a Bird API key that starts with bk_us1_, bk_eu1_, bm_us1_ or bm_eu1_.");
  }
  return `https://${region}.platform.bird.com`;
}

const bird = defineProvider({
  name: "Bird",
  hosts: ["us1.platform.bird.com", "eu1.platform.bird.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account.fields.token)}/v1/workspace`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const workspace = await decodeJson(response, object({ id: string(), name: string() }));
    return { accountInfo: { externalId: workspace.id, displayName: workspace.name } };
  },
});

export default defineApp(
  { user: { accounts: { bird: bird.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bird ?? [],
        (account) => {
          const base = origin(account.fields.token);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Bird",
        description:
          "Bird (formerly MessageBird): send and manage email, SMS and WhatsApp messages, broadcasts, verification, realtime messaging and workspace settings.",
        icons,
      },
    ),
  }),
);
