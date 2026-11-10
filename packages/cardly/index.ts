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

const cardly = defineProvider({
  name: "Cardly",
  hosts: ["api.card.ly"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.card.ly/v2/account/balance", {
      signal,
      headers: { "API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

// Cardly's docs require `Content-type: text/json` for POST bodies and warn that other types
// "will likely fail"; the OpenAPI document says application/json, so rewrite it on the way out.
const withTextJson = (inner: typeof fetch): typeof fetch => (input, init) => {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  if (headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    headers.set("content-type", "text/json");
    return inner(input, { ...init, headers });
  }
  return inner(input, init);
};

const description =
  "Send physical greeting cards with Cardly: artwork, templates, contacts and lists, orders, invitations, webhooks and account balance.";

export default defineApp(
  { user: { accounts: { cardly: cardly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cardly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch: withTextJson(fetch), signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cardly",
        description,
        icons,
        instructions:
          "Test-mode keys (prefixed test_) validate requests but never place orders; live keys (live_) are billable.",
      },
    ),
  }),
);
