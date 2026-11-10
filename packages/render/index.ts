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
import { renderCustom } from "./custom.js";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const render = defineProvider({
  name: "Render",
  hosts: ["api.render.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.render.com/v1/owners?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { render: render.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.render ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        // Hand-written tools for operations the OpenAPI compiler skips (services, Postgres, key-value, jobs, ...).
        core: await accountRouter(user?.accounts.render ?? [], (account) => renderCustom(account.fields.token, fetch, signal), { signal }),
      },
      {
        title: "Render",
        description: "Manage Render services, deploys, Postgres, key-value stores, environment variables, domains, jobs and projects.",
        icons,
      },
    ),
  }),
);
