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

const codemagic = defineProvider({
  name: "Codemagic",
  hosts: ["codemagic.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://codemagic.io/api/v3/user", {
      signal,
      headers: { "x-auth-token": account.fields.token },
    });
    await decodeJson(response, object({ data: object({ id: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { codemagic: codemagic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.codemagic ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Codemagic",
        description:
          "Codemagic CI/CD for mobile apps: apps, builds, workflows, variable groups, tester groups, teams, previews, analytics and over-the-air updates.",
        icons,
      },
    ),
  }),
);
