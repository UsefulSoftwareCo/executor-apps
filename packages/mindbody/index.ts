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

const mindbody = defineProvider({
  name: "Mindbody",
  hosts: ["api.mindbodyonline.com"],
  auth: {
    apiKey: secrets({
      label: "API key and site ID",
      fields: object({
        apiKey: string({ minLength: 1 }),
        siteId: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mindbodyonline.com/public/v6/site/locations", {
      signal,
      headers: { "API-Key": account.fields.apiKey, SiteId: account.fields.siteId },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mindbody: mindbody.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mindbody ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: {
                path: { version: "6" },
                headers: { siteId: String(account.fields.siteId), version: "6" },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Mindbody",
        description:
          "Mindbody Public API v6: classes, appointments, clients, sales, staff, enrollments and site data.",
        icons,
        instructions:
          "Calls are scoped to the connected site ID. Operations that act as a staff member take an optional `authorization` header carrying a staff user token. Never ask for or accept a staff username or password in chat; if a staff token is needed, tell the user to supply it through a secure link or their own tooling.",
      },
    ),
  }),
);
