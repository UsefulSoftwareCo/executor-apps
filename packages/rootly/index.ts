import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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

const rootly = defineProvider({
  name: "Rootly",
  hosts: ["api.rootly.com", "rootly.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Rootly publishes RFC 8414 metadata at rootly.com and supports RFC 7591 dynamic client registration.
    // "all" is the vendor's non-admin catch-all scope covering incident response and on-call APIs.
    oauth: oauth2({ discover: "https://rootly.com", scopes: ["all"] }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.rootly.com/v1/users/me", {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { rootly: rootly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rootly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rootly",
        description: "Manage incidents, alerts, on-call, retrospectives, status pages and workflows in Rootly.",
        icons,
      },
    ),
  }),
);
