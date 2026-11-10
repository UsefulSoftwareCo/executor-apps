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

const safetyculture = defineProvider({
  name: "SafetyCulture",
  hosts: ["api.mitti.com"],
  auth: {
    apiKey: secrets({
      label: "API token (user or service user)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mitti.com/share/connections", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { safetyculture: safetyculture.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.safetyculture ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SafetyCulture",
        description:
          "SafetyCulture (now Mitti): inspections, templates, actions, issues, assets, sites, users, groups, training, documents and webhooks.",
        icons,
      },
    ),
  }),
);
