import {
  accountRouter,
  boolean,
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
import { guardOptions, platformOptions } from "./openapi.js";

const lakera = defineProvider({
  name: "Lakera Guard",
  hosts: ["api.lakera.ai", "platform.lakera.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reads the last hour of Guard logs: read-only, works with a read-only key.
  async health({ account, fetch, signal }) {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    const response = await fetch("https://platform.lakera.ai/api/v1-beta/logs", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: start.toISOString(), end_time: end.toISOString(), limit: 1 }),
    });
    await decodeJson(response, object({ has_more: boolean() }));
  },
});

export default defineApp(
  { user: { accounts: { lakeraguard: lakera.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lakeraguard ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              guard: approve(liveOpenapiRouter({ ...guardOptions, cache, fetch, signal, account })),
              platform: approve(liveOpenapiRouter({ ...platformOptions, cache, fetch, signal, account })),
            },
            { title: "Lakera Guard", description: "Lakera Guard account." },
          );
        },
        { signal },
      ),
      {
        title: "Lakera Guard",
        description:
          "Lakera Guard AI security. guard: screen prompts, responses and tool calls, fetch screening results, lint and check policies. platform: manage policies and projects, query logs and analytics.",
        icons,
      },
    ),
  }),
);
