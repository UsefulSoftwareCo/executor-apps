import {
  accountRouter,
  array,
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

const triggerdev = defineProvider({
  name: "Trigger.dev",
  hosts: ["api.trigger.dev"],
  auth: {
    apiKey: secrets({
      label: "Secret key or personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.trigger.dev/api/v1/queues", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: array(object({})), pagination: object({}) }));
  },
});

export default defineApp(
  { user: { accounts: { triggerdev: triggerdev.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.triggerdev ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Trigger.dev",
        description:
          "Trigger tasks and manage runs, schedules, queues, batches, environment variables, deployments and waitpoints on Trigger.dev.",
        icons,
      },
    ),
  }),
);
