import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const e2b = defineProvider({
  name: "E2B",
  hosts: ["api.e2b.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.e2b.app/v2/sandboxes", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, json());
  },
});

export default defineApp(
  { user: { accounts: { e2b: e2b.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.e2b ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "E2B",
        description: "Run and manage E2B cloud sandboxes: lifecycle, logs, metrics, templates and snapshots.",
        icons,
      },
    ),
  }),
);
