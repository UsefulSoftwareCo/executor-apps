import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const bugherd = defineProvider({
  name: "BugHerd",
  hosts: ["www.bugherd.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://www.bugherd.com/api_v2/organization.json", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:x`)}` },
    });
    const org = await decodeJson(response, object({ organization: object({ id: number(), name: string() }) }));
    return {
      accountInfo: { externalId: String(org.organization.id), displayName: org.organization.name },
    };
  },
});

export default defineApp(
  { user: { accounts: { bugherd: bugherd.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bugherd ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              // The key is the Basic username; the password is the non-secret constant "x".
              account: { ...account, fields: { ...account.fields, basicPassword: "x" } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "BugHerd",
        description: "Visual feedback and bug tracking: projects, tasks, comments, attachments, users and webhooks.",
        icons,
      },
    ),
  }),
);
