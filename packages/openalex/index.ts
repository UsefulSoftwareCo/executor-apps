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

const openalex = defineProvider({
  name: "OpenAlex",
  hosts: ["api.openalex.org"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Sent as a bearer token, which OpenAlex accepts the same as the api_key parameter, so the key stays out of the URL.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.openalex.org/rate-limit", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { openalex: openalex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openalex ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenAlex",
        description: "Search the open scholarly catalog: works, authors, sources, institutions, topics, publishers, funders and awards.",
        icons,
      },
    ),
  }),
);
