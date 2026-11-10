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

const flatfile = defineProvider({
  name: "Flatfile",
  hosts: ["api.x.flatfile.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.x.flatfile.com/v1/accounts/current", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "X-Disable-Hooks": "true" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { flatfile: flatfile.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.flatfile ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account,
              // The vendor spec requires this header on every operation. It turns off data hooks and validation on sheets.
              parameterDefaults: { headers: { "X-Disable-Hooks": "true" } },
            }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Flatfile",
        description: "Manage Flatfile data import: spaces, workbooks, sheets, records, files, jobs, agents and environments.",
        icons,
      },
    ),
  }),
);
