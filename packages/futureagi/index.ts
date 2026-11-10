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

const futureagi = defineProvider({
  name: "Future AGI",
  hosts: ["api.futureagi.com"],
  auth: {
    apiKey: secrets({
      label: "API key and secret key",
      fields: object({ apiKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  // The API has no current-user endpoint; listing annotation labels is a cheap authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.futureagi.com/model-hub/annotations-labels/", {
      signal,
      headers: { "X-Api-Key": account.fields.apiKey, "X-Secret-Key": account.fields.secretKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { futureagi: futureagi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.futureagi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Future AGI",
        description:
          "Future AGI: evaluation groups, annotation labels, queues and scores, and simulation scenarios, agent definitions and run tests (create and execute operations).",
        icons,
      },
    ),
  }),
);
