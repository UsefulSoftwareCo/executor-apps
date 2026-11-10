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

const goodapi = defineProvider({
  name: "GoodAPI",
  hosts: ["app.thegoodapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.thegoodapi.com/dashboard_url", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({ dashboard_url: string({ minLength: 1 }) }));
  },
});

export default defineApp(
  { user: { accounts: { goodapi: goodapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.goodapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GoodAPI",
        description: "Plant trees, rescue plastic bottles and donate to charities with GoodAPI: plantings, refunds, evidence, projects and impact dashboard.",
        icons,
      },
    ),
  }),
);
