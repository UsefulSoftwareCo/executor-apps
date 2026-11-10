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
import { options, specUrl } from "./openapi.js";

const predictleads = defineProvider({
  name: "PredictLeads",
  hosts: ["predictleads.com"],
  auth: {
    apiKey: secrets({
      label: "API key and token",
      fields: object({ apiKey: string({ minLength: 1 }), apiToken: string({ minLength: 1 }) }),
    }),
  },
  // The subscription endpoint is free and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://predictleads.com/api/v3/api_subscription", {
      signal,
      headers: { "X-Api-Key": account.fields.apiKey, "X-Api-Token": account.fields.apiToken },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { predictleads: predictleads.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.predictleads ?? [],
        async (account) => {
          const document = await cache.forAccount(account).get({
            key: ["openapi-definition", specUrl, "v1"],
            schema: record(json()),
            freshFor: "1 hour",
            load: async ({ fetch, signal }) =>
              JSON.parse(JSON.stringify(normalize(await decodeJson(await fetch(specUrl, { signal }), record(json()))))),
          });
          return withApprovals(
            liveOpenapiRouter({ ...options, source: { document }, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "PredictLeads",
        description:
          "Company intelligence: companies, job openings, technology detections, financing and news events, connections, products, SEC filings and GitHub repositories.",
        icons,
      },
    ),
  }),
);
