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

const bugsnag = defineProvider({
  name: "Bugsnag",
  hosts: ["api.bugsnag.com"],
  auth: {
    apiKey: secrets({
      label: "Personal auth token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The definition has no GET /user; the current user's organizations list is documented and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.bugsnag.com/user/organizations?per_page=1", {
      signal,
      headers: { Authorization: `token ${account.fields.token}`, "X-Version": "2" },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { bugsnag: bugsnag.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bugsnag ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              parameterDefaults: { headers: { "X-Version": "2" } },
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Bugsnag",
        description:
          "Bugsnag error monitoring: organizations, projects, errors, events, comments, releases, trends, feature flags and performance spans.",
        instructions:
          "Find an organization with currentUser.listUserOrganizations, then a project with currentUser.getOrganizationProjects.",
        icons,
      },
    ),
  }),
);
