import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { addresses } from "./tools/shared.js";
import { tasks as tasksTools } from "./tools/tasks.js";
import { options } from "./openapi.js";

const TaskLists = object({ kind: string() });

const tasks = defineProvider({
  name: "Google Tasks",
  hosts: ["tasks.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["https://www.googleapis.com/auth/tasks"],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    // The Tasks API has no profile endpoint; listing task lists proves the token works.
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, TaskLists);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { tasks: tasks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const curated = tasksTools({ accounts: user?.accounts.tasks ?? [], address: addresses.id, api: () => "api" });
    return {
      tools: router(
        {
          ...curated.tools,
          api: router(
            await accountRouter(
              user?.accounts.tasks ?? [],
              (account) =>
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              { signal },
            ),
            {
              title: "Google Tasks API",
              description: "The complete Google Tasks API, per account: every tool takes accountId and the API's own input.",
            },
          ),
        },
        {
          instructions: curated.meta.instructions,
          title: "Google Tasks",
          description: "Task lists and tasks in Google Tasks: create, update, complete, move and clear.",
          icons,
        },
      ),
    };
  },
);
