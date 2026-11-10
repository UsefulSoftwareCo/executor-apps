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

const ninox = defineProvider({
  name: "Ninox",
  hosts: ["go.ninox.com"],
  auth: {
    apiKey: secrets({
      label: "Workspace API key",
      fields: object({ token: string({ minLength: 1 }), workspaceId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://go.ninox.com/api/v1/workspace/${encodeURIComponent(account.fields.workspaceId)}`,
      { signal, headers: { Authorization: `Bearer ${account.fields.token}` } },
    );
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.workspaceId } };
  },
});

export default defineApp(
  { user: { accounts: { ninox: ninox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ninox ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ninox",
        description: "Ninox low-code databases: modules, tables, fields, records, views, reports, files and scripts. Every tool takes the workspaceId of the workspace the API key belongs to.",
        icons,
      },
    ),
  }),
);
