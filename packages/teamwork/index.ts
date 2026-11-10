import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Basic password: the docs give `{API_KEY or username}:password` without saying what the password
// must be; with the API key as the username it is a non-secret placeholder.
const BASIC_PASSWORD = "x";

// Every Teamwork site lives on its own host: https://<site>.teamwork.com.
function normalizeSite(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(?:\.teamwork\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <site> of <site>.teamwork.com (letters, digits, hyphens).");
  return match[1]!;
}

const Me = object({
  person: object({ id: number(), firstName: string(), lastName: string(), email: string() }),
});

const teamwork = defineProvider({
  name: "Teamwork",
  hosts: ["*.teamwork.com"],
  auth: {
    // The API key is the Basic username; the password is the constant "x".
    // Teamwork OAuth apps return the site host in the token response, which a provider cannot
    // template, so only the API key is offered.
    apiKey: secrets({
      label: "API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const site = normalizeSite(account.fields.site);
    const response = await fetch(`https://${site}.teamwork.com/projects/api/v3/me.json`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.apiKey}:${BASIC_PASSWORD}`)}`,
        Accept: "application/json",
      },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(me.person.id),
        displayName: `${me.person.firstName} ${me.person.lastName}`,
        email: me.person.email,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { teamwork: teamwork.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teamwork ?? [],
        (account) => {
          const origin = `https://${normalizeSite(account.fields.site)}.teamwork.com`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache,
              fetch,
              signal,
              account: { ...account, fields: { ...account.fields, basicPassword: BASIC_PASSWORD } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Teamwork",
        description:
          "Teamwork.com projects, tasks, task lists, milestones, time tracking, people, companies, budgets and reports.",
        instructions: "Results depend on the permissions of the user who owns the API key.",
        icons,
      },
    ),
  }),
);
