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

const crustdata = defineProvider({
  name: "Crustdata",
  hosts: ["api.crustdata.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Free endpoint that consumes no credits; it requires the version header.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.crustdata.com/account/credits", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "x-api-version": "2025-11-01" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { crustdata: crustdata.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.crustdata ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, parameterDefaults: { headers: { "x-api-version": "2025-11-01" } }, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Crustdata",
        description:
          "B2B company and people data from Crustdata: search, enrich and identify companies and people, jobs, web search, social posts, batch jobs and watches.",
        instructions:
          "Many endpoints spend credits (check getAccountCredits, which is free); some live endpoints are enterprise-only.",
        icons,
      },
    ),
  }),
);
