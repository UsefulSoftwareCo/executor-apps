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

const ninety = defineProvider({
  name: "Ninety",
  hosts: ["api.public.ninety.io"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.public.ninety.io/v1/teams", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { ninety: ninety.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ninety ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ninety",
        description: "Run your EOS operating system in Ninety: to-dos, issues, rocks, milestones, scorecard, meetings, teams and users.",
        icons,
      },
    ),
  }),
);
