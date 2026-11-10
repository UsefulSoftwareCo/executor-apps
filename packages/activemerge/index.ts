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

const activemerge = defineProvider({
  name: "ActiveMerge",
  hosts: ["app.activemerge.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.activemerge.com/api/user/credits", {
      signal,
      headers: { "API-KEY": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { activemerge: activemerge.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.activemerge ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ActiveMerge",
        description:
          "Generate documents and images from templates, merge documents, run workflows, send e-signature requests and manage files with ActiveMerge.",
        icons,
      },
    ),
  }),
);
