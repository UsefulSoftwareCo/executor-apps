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

const datagma = defineProvider({
  name: "Datagma",
  hosts: ["gateway.datagma.net"],
  auth: {
    apiKey: secrets({
      label: "API key (apiId)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The credit balance endpoint is read-only.
  async health({ account, fetch, signal }) {
    const url = new URL("https://gateway.datagma.net/api/ingress/v1/mine");
    url.searchParams.set("apiId", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { datagma: datagma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.datagma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Datagma",
        description: "B2B data enrichment with Datagma: enrich people and companies, find work emails and phone numbers, find people by job title, reverse lookups and job change detection.",
        icons,
      },
    ),
  }),
);
