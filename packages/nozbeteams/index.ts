import {
  accountRouter,
  decodeJson,
  array,
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

const nozbe = defineProvider({
  name: "Nozbe Teams",
  hosts: ["api4.nozbe.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api4.nozbe.com/v1/api/teams?limit=1", {
      signal,
      headers: { Authorization: `apikey ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { nozbeteams: nozbe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nozbeteams ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nozbe Teams",
        description: "Tasks, projects, comments, reminders, tags, recurrences and team members in Nozbe Teams.",
        icons,
      },
    ),
  }),
);
