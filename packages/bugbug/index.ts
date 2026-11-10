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

const bugbug = defineProvider({
  name: "BugBug",
  hosts: ["app.bugbug.io"],
  auth: {
    apiKey: secrets({
      label: "Project API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The status probe never rejects a bad token, so check an authenticated read instead.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.bugbug.io/api/v2/tests/", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { bugbug: bugbug.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bugbug ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "BugBug",
        description: "Manage and run BugBug browser tests: tests, suites, runs, steps, components, tags and project settings.",
        icons,
      },
    ),
  }),
);
