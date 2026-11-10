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

const basin = defineProvider({
  name: "Basin",
  hosts: ["usebasin.com"],
  auth: {
    apiKey: secrets({
      label: "Account API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://usebasin.com/api/v1/domains", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({ domains: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { basin: basin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.basin ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Basin",
        description: "Manage Basin form backends: forms, submissions, projects, domains, webhooks and mail templates.",
        icons,
      },
    ),
  }),
);
