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

// GET operations the spec marks with a non-"none" x-credit-cost; they spend credits despite being queries.
const creditSpendingReads = new Set(["email.findGet", "email.verifyGet"]);

const getprospect = defineProvider({
  name: "GetProspect",
  hosts: ["api.getprospect.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.getprospect.com/v2/me", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { getprospect: getprospect.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.getprospect ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || creditSpendingReads.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GetProspect",
        description: "Find and verify business emails, enrich and search people and companies, manage blocklists and webhooks with GetProspect.",
        icons,
      },
    ),
  }),
);
