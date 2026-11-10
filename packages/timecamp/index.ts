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

const timecamp = defineProvider({
  name: "TimeCamp",
  hosts: ["app.timecamp.com"],
  auth: {
    // The token is on the profile page: https://app.timecamp.com/app#/settings/users/me
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.timecamp.com/third_party/api/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { timecamp: timecamp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.timecamp ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TimeCamp",
        description:
          "Time tracking with TimeCamp: time entries, timers, projects and tasks, users and groups, tags, approvals, attendance, billing rates, expenses and custom fields.",
        icons,
      },
    ),
  }),
);
