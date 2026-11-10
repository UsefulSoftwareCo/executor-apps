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

const nooks = defineProvider({
  name: "Nooks",
  hosts: ["partner-api.nooks.in", "oauth.nooks.in"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Nooks publishes RFC 8414 metadata; the connect page asks for the OAuth app's client.
    oauth: oauth2({
      discover: "https://oauth.nooks.in",
      scopes: [
        "prospects:read",
        "prospects:write",
        "sequences:read",
        "sequences:write",
        "sequence-steps:read",
        "sequence-steps:write",
        "sequence-states:read",
        "sequence-states:write",
        "tags:read",
        "tags:write",
        "tasks:read",
        "tasks:write",
        "calls:read",
        "calls:write",
        "call-dispositions:read",
        "emails:read",
        "emails:write",
        "email-templates:read",
        "mailboxes:read",
        "users:read",
        "accounts:read",
        "notes:write",
        "opportunities:read",
        "search:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://partner-api.nooks.in/v1/users?page[size]=1", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { nooks: nooks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nooks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nooks",
        description:
          "Sequences, steps, prospects, accounts, enrollments, calls, emails, tasks, notes, mailboxes and users in Nooks.",
        icons,
      },
    ),
  }),
);
