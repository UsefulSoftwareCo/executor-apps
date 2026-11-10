import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ user: object({ id: number(), name: string() }) });

const hubstaff = defineProvider({
  name: "Hubstaff",
  hosts: ["api.hubstaff.com", "account.hubstaff.com"],
  auth: {
    // Hubstaff publishes OIDC metadata; the user registers an app at developer.hubstaff.com.
    oauth: oauth2({
      discover: "https://account.hubstaff.com",
      scopes: ["hubstaff:read", "hubstaff:write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.hubstaff.com/v2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.user.id), username: me.user.name } };
  },
});

export default defineApp(
  { user: { accounts: { hubstaff: hubstaff.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hubstaff ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Hubstaff",
        description:
          "Time tracking, projects, tasks, members, timesheets, payments and activity reports from the Hubstaff API v2.",
        icons,
      },
    ),
  }),
);
