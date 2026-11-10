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

const simplesat = defineProvider({
  name: "Simplesat",
  hosts: ["api.simplesat.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists one page of surveys (GET /api/v1/surveys); the key needs the `read surveys` scope.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.simplesat.io/api/v1/surveys?page_size=1", {
      signal,
      headers: { "X-Simplesat-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { simplesat: simplesat.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simplesat ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Simplesat",
        description: "Customer satisfaction surveys with Simplesat: surveys, questions, responses, answers, customers and team members.",
        icons,
      },
    ),
  }),
);
