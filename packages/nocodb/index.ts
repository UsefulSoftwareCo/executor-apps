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

const nocodb = defineProvider({
  name: "NocoDB",
  hosts: ["app.nocodb.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.nocodb.com/api/v2/meta/bases/", {
      signal,
      headers: { "xc-token": account.fields.token },
    });
    await decodeJson(response, object({ list: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { nocodb: nocodb.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nocodb ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "NocoDB",
        description: "NocoDB Cloud: bases, tables, fields, views, records, attachments, filters, sorts, webhooks and sharing.",
        instructions:
          "Uses an API token (xc-token). The spec's xc-auth JWT header is removed from every operation; sign-in, sign-up, password and profile operations still need a user session and will be rejected with an API token.",
        icons,
      },
    ),
  }),
);
