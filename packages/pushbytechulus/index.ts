import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://push.techulus.com";

const push = defineProvider({
  name: "Push by Techulus",
  hosts: ["push.techulus.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no read-only endpoint, and every call sends a notification or changes a team,
  // so there is no health check.
});

type Account = { method: string; fields: { token: string } };

const call = (account: Account, signal: AbortSignal, fetch: typeof globalThis.fetch) => async (
  method: "POST" | "DELETE",
  path: string,
  body: Record<string, string>,
) =>
  decodeJson(
    await fetch(`${base}${path}`, {
      method,
      signal,
      headers: { "content-type": "application/json", "x-api-key": account.fields.token },
      body: JSON.stringify(body),
    }),
    json(),
  );

const pushTools = (
  account: Account,
  signal: AbortSignal,
  cache: Parameters<typeof liveOpenapiRouter>[0]["cache"],
  fetch: typeof globalThis.fetch,
) =>
  router({
    // Every notify operation sends a notification, so all of them need approval.
    notifications: withApprovals(
      router(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), {
        title: "Notifications",
        description: "Send push notifications to all devices, a team, or a device group.",
      }),
      () => always(),
    ),
    teams: router(
      {
        invite: mutation(
          {
            description:
              "Invite a user by email to a team (beta Management API). team is the team's API key. Needs the account API key.",
            input: object({ team: string(), email: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(account, signal, fetch)("POST", "/api/management/v1/teams/invite", input),
        ),
        removeMember: mutation(
          {
            description:
              "Remove a member from a team, or cancel their pending invite, by email (beta Management API). team is the team's API key. Needs the account API key.",
            input: object({ team: string(), email: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(account, signal, fetch)("DELETE", "/api/management/v1/teams/invite", input),
        ),
      },
      { title: "Teams", description: "Invite or remove team members." },
    ),
  });

export default defineApp({ user: { accounts: { push: push.many() } }, icons }, async ({ user, cache, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.push ?? [], (account) => pushTools(account, signal, cache, fetch), { signal }), {
    title: "Push by Techulus",
    description: "Send push notifications with Push by Techulus: notify all devices, a team or a device group, and manage team invites.",
    icons,
  }),
}));
