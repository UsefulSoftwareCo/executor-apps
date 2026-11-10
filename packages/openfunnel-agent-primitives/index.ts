import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const openfunnel = defineProvider({
  name: "OpenFunnel Agent Primitives",
  hosts: ["api.openfunnel.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /credits/balance needs only a valid key, whatever scopes it holds.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.openfunnel.dev/api/v1/credits/balance", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`OpenFunnel rejected the API key (${response.status})`);
    await decodeJson(response, object({ total_credits: number(), credits_used: number() }));
  },
});

export default defineApp(
  { user: { accounts: { openfunnel: openfunnel.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openfunnel ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenFunnel Agent Primitives",
        description: "Find, research, qualify and enrich companies and people for GTM with OpenFunnel: lookalike and tech-stack search, deep research, enrichment, signals, audiences and credits.",
        icons,
      },
    ),
  }),
);
