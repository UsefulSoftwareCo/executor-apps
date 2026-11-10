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

const akta = defineProvider({
  name: "Akta",
  hosts: ["api.akta.pro"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Industry search is a free endpoint, so the check costs no credits. The trailing slash is the
  // canonical path; without it the server answers 307.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.akta.pro/api/v1/industry/search/?query=software", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    // The spec lists 204 (no matches) as a success with no body; decodeJson would reject it.
    if (response.status === 204) return;
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { akta: akta.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.akta ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Akta",
        description: "Akta private company intelligence: company search and enrichment, news, headcount, jobs, reviews, website traffic and company lists.",
        icons,
      },
    ),
  }),
);
