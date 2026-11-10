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

const onedesk = defineProvider({
  name: "OneDesk",
  hosts: ["app.onedesk.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.onedesk.com/rest/public/organization/profileAndPolicy", {
      signal,
      headers: { "OD-Public-API-Key": account.fields.token },
    });
    const body = await decodeJson(response, object({ code: string() }));
    if (body.code !== "SUCCESS") {
      throw new Error(`OneDesk health check failed: ${body.code}`);
    }
  },
});

export default defineApp(
  { user: { accounts: { onedesk: onedesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onedesk ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OneDesk",
        description: "OneDesk help desk and project management: items, projects, customers, users, teams, timesheets, conversations, invoices and quotes.",
        icons,
      },
    ),
  }),
);
