import {
  accountRouter,
  base64,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  number,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { helpCenterOptions, siteUrl, supportOptions } from "./openapi.js";

const Me = object({ user: object({ id: number(), name: string() }) });

const zendesk = defineProvider({
  name: "Zendesk",
  hosts: ["*.zendesk.com"],
  auth: {
    // OAuth is not declared: Zendesk's authorize and token endpoints are per-subdomain
    // (https://<subdomain>.zendesk.com/oauth/...) and the framework only takes static endpoint strings.
    apiToken: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ email, token }) =>
        header("authorization", t`Basic ${base64(t`${email}/token:${token}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.subdomain)}/api/v2/users/me.json`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const { user } = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(user.id),
        displayName: user.name,
        email: account.fields.email,
      },
    };
  },
});

const description =
  "Zendesk Support tickets, users, organizations, groups, views, macros, triggers, automations and the Help Center articles API.";

export default defineApp(
  { user: { accounts: { zendesk: zendesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zendesk ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          const approvals = (tool: { kind: string }) => (tool.kind === "mutation" ? always() : undefined);
          return router({
            support: withApprovals(
              liveOpenapiRouter({
                ...supportOptions(account.fields.subdomain),
                cache,
                fetch: signed,
                signal,
                account,
              }),
              approvals,
            ),
            helpCenter: withApprovals(
              liveOpenapiRouter({
                ...helpCenterOptions(account.fields.subdomain),
                cache,
                fetch: signed,
                signal,
                account,
              }),
              approvals,
            ),
          });
        },
        { signal },
      ),
      { title: "Zendesk", description, icons },
    ),
  }),
);
