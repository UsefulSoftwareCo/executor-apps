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

const kadoa = defineProvider({
  name: "Kadoa",
  hosts: ["api.kadoa.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.kadoa.com/v4/me/features", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Kadoa rejected the API key (${response.status})`);
    await decodeJson(response, object({ features: object({}) }));
  },
});

export default defineApp(
  { user: { accounts: { kadoa: kadoa.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kadoa ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || name === "workflows.getDataExport" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kadoa",
        description: "Create, run and monitor Kadoa web data extraction workflows, schemas, crawls, notifications and extracted data.",
        icons,
      },
    ),
  }),
);
