import {
  accountRouter,
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

const memberspot = defineProvider({
  name: "Memberspot",
  hosts: ["api.memberspot.de"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /api-auth returns the school the key belongs to.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.memberspot.de/api-auth", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (!response.ok) throw new Error(`Memberspot rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { memberspot: memberspot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.memberspot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || name.endsWith("usersApiControllerCreateLoginTokenV1")
              ? always()
              : undefined,
          ),
        { signal },
      ),
      {
        title: "Memberspot",
        description: "Manage Memberspot users, offers, orders, course progress, chapter access, exams and custom user properties.",
        icons,
      },
    ),
  }),
);
