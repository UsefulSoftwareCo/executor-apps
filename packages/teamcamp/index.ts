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
import { authOptions, backProjectOptions, backTaskOptions, companyOptions, projectGroupOptions, projectOptions, taskOptions } from "./openapi.js";

const teamcamp = defineProvider({
  name: "Teamcamp",
  hosts: ["api.teamcamp.app", "back.teamcamp.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.teamcamp.app/v1.0/verify", {
      signal,
      headers: { apiKey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { teamcamp: teamcamp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teamcamp ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({
            auth: mount(authOptions),
            company: mount(companyOptions),
            projects: mount(projectOptions),
            projectGroups: mount(projectGroupOptions),
            tasks: mount(taskOptions),
            projectDetails: mount(backProjectOptions),
            taskUpdates: mount(backTaskOptions),
          });
        },
        { signal },
      ),
      {
        title: "Teamcamp",
        description: "Manage Teamcamp projects, tasks, comments, workspace users and customers.",
        icons,
      },
    ),
  }),
);
