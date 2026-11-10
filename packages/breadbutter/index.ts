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

const breadbutter = defineProvider({
  name: "Bread & Butter",
  hosts: ["api.breadbutter.io"],
  auth: {
    appSecret: secrets({
      label: "App secret",
      fields: object({ appId: string({ minLength: 1 }), appSecret: string({ minLength: 1 }) }),
    }),
  },
  // GET /apps/{app_id}/credits is read-only and app-scoped. The Authorization header is the spec-declared scheme; unverified against a live account.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.breadbutter.io/apps/${encodeURIComponent(account.fields.appId)}/credits`,
      { signal, headers: { Authorization: account.fields.appSecret } },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { breadbutter: breadbutter.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.breadbutter ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bread & Butter",
        description:
          "Bread & Butter lead intelligence: apps, leads and lead lists, events, attribution reports, domains, integrations and identity providers.",
        icons,
      },
    ),
  }),
);
