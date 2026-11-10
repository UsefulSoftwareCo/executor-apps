import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { normalize } from "./normalize.js";
import { options } from "./openapi.js";

const specUrl = "https://www.hackerrank.com/apidoc";

const hackerrank = defineProvider({
  name: "HackerRank Work",
  hosts: ["www.hackerrank.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://www.hackerrank.com/x/api/v3/users?limit=1&offset=0", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { hackerrank: hackerrank.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hackerrank ?? [],
        async (account) => {
          const document = await cache.forAccount(account).get({
            key: ["openapi-definition", specUrl, "v1"],
            schema: record(json()),
            freshFor: "1 hour",
            load: async ({ fetch, signal }) => {
              const normalized = normalize(await decodeJson(await fetch(specUrl, { signal }), record(json())));
              return JSON.parse(JSON.stringify(normalized));
            },
          });
          return withApprovals(
            liveOpenapiRouter({ ...options, source: { document }, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "HackerRank Work",
        description:
          "HackerRank for Work: coding tests, candidate invites and reports, interviews, interview templates, questions, users and teams.",
        icons,
      },
    ),
  }),
);
