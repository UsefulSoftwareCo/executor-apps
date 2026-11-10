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
import { options, reportsOptions, webhooksOptions } from "./openapi.js";

// Toggl Track uses HTTP Basic: the API token is the username and the literal "api_token" the password.
const basic = (token: string) => `Basic ${btoa(`${token}:api_token`)}`;

const toggl = defineProvider({
  name: "Toggl Track",
  hosts: ["api.track.toggl.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /me draws on the per-user hourly quota (30 requests per hour on the Free plan).
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.track.toggl.com/api/v9/me", {
      signal,
      headers: { Authorization: basic(account.fields.token) },
    });
    const me = await decodeJson(response, object({ id: number(), email: string() }));
    return { accountInfo: { externalId: String(me.id), email: me.email } };
  },
});

type Fetch = typeof fetch;

// The generated Basic header would be "<token>:" (empty password); replace it with the form Toggl requires.
const tokenFetch =
  (fetcher: Fetch, token: string): Fetch =>
  (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", basic(token));
    return fetcher(input, { ...init, headers });
  };

export default defineApp(
  { user: { accounts: { toggl: toggl.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.toggl ?? [],
        (account) => {
          const f = tokenFetch(fetch, account.fields.token);
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              track: approve(liveOpenapiRouter({ ...options, cache, fetch: f, signal, account })),
              reports: approve(liveOpenapiRouter({ ...reportsOptions, cache, fetch: f, signal, account })),
              webhooks: approve(liveOpenapiRouter({ ...webhooksOptions, cache, fetch: f, signal, account })),
            },
            { title: "Toggl Track", description: "Toggl Track account." },
          );
        },
        { signal },
      ),
      {
        title: "Toggl Track",
        description:
          "Time tracking in Toggl Track. track: Track API v9 (time entries, projects, clients, tags, tasks, workspaces, organizations, groups). reports: Reports API v3 and Insights. webhooks: webhook subscriptions. Find workspace ids with track me workspaces.",
        icons,
      },
    ),
  }),
);
