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

const quickbase = defineProvider({
  name: "Quickbase",
  hosts: ["api.quickbase.com"],
  auth: {
    apiKey: secrets({
      label: "User token and realm hostname",
      fields: object({
        token: string({ minLength: 1 }),
        realm: string({ minLength: 1 }),
      }),
    }),
  },
  // POST /users is Quickbase's read-only user query; the spec has no GET that needs no app or table id.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.quickbase.com/v1/users", {
      signal,
      method: "POST",
      headers: {
        Authorization: `QB-USER-TOKEN ${account.fields.token}`,
        "QB-Realm-Hostname": account.fields.realm,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { quickbase: quickbase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quickbase ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: {
                headers: {
                  Authorization: `QB-USER-TOKEN ${String(account.fields.token)}`,
                  "QB-Realm-Hostname": String(account.fields.realm),
                },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Quickbase",
        description:
          "Quickbase low-code apps: apps, tables, fields, records, reports, relationships, formulas, users, groups, audit logs and solutions.",
        icons,
      },
    ),
  }),
);
