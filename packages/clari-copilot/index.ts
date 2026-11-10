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

const clariCopilot = defineProvider({
  name: "Clari Copilot",
  hosts: ["rest-api.copilot.clari.com"],
  auth: {
    apiKey: secrets({
      label: "API key and password",
      fields: object({
        apiKey: string({ minLength: 1 }),
        apiPassword: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://rest-api.copilot.clari.com/users", {
      signal,
      headers: {
        "X-Api-Key": account.fields.apiKey,
        "X-Api-Password": account.fields.apiPassword,
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { clariCopilot: clariCopilot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clariCopilot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Clari Copilot",
        description:
          "Clari Copilot conversation intelligence: calls, call details, scorecards, topics, users, and CRM accounts, contacts and deals.",
        icons,
      },
    ),
  }),
);
