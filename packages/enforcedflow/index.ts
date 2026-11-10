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

const enforcedflow = defineProvider({
  name: "EnforcedFlow",
  hosts: ["app.enforcedflow.com"],
  auth: {
    apiKey: secrets({
      label: "Provider key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.enforcedflow.com/api/v1/advanced-round-robin/groups", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { enforcedflow: enforcedflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.enforcedflow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "EnforcedFlow",
        description: "Advanced round-robin routing: list groups and fields, manage agents, and pick the next agent or email assignment.",
        icons,
      },
    ),
  }),
);
