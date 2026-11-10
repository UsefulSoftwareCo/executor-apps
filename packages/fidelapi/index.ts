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

const fidelapi = defineProvider({
  name: "Fidel API",
  hosts: ["api.fidel.uk"],
  auth: {
    apiKey: secrets({
      label: "Secret API key (sk_test_... or sk_live_...)",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.fidel.uk/v1/programs?limit=1", {
      signal,
      headers: { "Fidel-Key": account.fields.key },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { fidelapi: fidelapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fidelapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fidel API",
        description:
          "Fidel API card linking: brands, programs, locations, cards, offers, transactions, webhooks, MIDs and missing transaction requests.",
        icons,
      },
    ),
  }),
);
