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
import { options, v3Options } from "./openapi.js";

const enrichlayer = defineProvider({
  name: "Enrich Layer",
  hosts: ["enrichlayer.com", "api.enrichlayer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The credit balance endpoint is free and needs no extra scope.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://enrichlayer.com/api/v2/credit-balance", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ credit_balance: number() }));
  },
});

export default defineApp(
  { user: { accounts: { enrichlayer: enrichlayer.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.enrichlayer ?? [],
        (account) => {
          const mount = (o: Parameters<typeof liveOpenapiRouter>[0] extends infer P ? Omit<P & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...o, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { v2: mount(options), v3: mount(v3Options) },
            { title: "Enrich Layer", description: "Enrich Layer API." },
          );
        },
        { signal },
      ),
      {
        title: "Enrich Layer",
        description: "Enrich people, companies, jobs and schools with Enrich Layer. v2: profiles, lookups, search, contact emails and phones, credit balance. v3: person profile and company logo.",
        icons,
      },
    ),
  }),
);
