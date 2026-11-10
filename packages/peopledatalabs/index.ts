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

const peopledatalabs = defineProvider({
  name: "People Data Labs",
  hosts: ["api.peopledatalabs.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Autocomplete is free and does not consume credits.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.peopledatalabs.com/v5/autocomplete?field=skill&text=a&size=1", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { peopledatalabs: peopledatalabs.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.peopledatalabs ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "People Data Labs",
        description:
          "B2B data enrichment with People Data Labs: person and company enrichment, search and identify, company/school/location cleaners, autocomplete, IP, job title and skill enrichment.",
        icons,
      },
    ),
  }),
);
