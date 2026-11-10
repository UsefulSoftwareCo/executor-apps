import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { resources } from "./resources.js";

const base = "https://api.focus.teamleader.eu";

const teamleader = defineProvider({
  name: "Teamleader Focus",
  hosts: ["api.focus.teamleader.eu", "focus.teamleader.eu"],
  auth: {
    // Teamleader has no personal API keys. The connect page asks for the client of an integration
    // registered at https://marketplace.focus.teamleader.eu/build. Scopes are chosen on that
    // integration, not requested in the authorization URL.
    oauth: oauth2({
      authorizationUrl: "https://focus.teamleader.eu/oauth2/authorize",
      tokenUrl: "https://focus.teamleader.eu/oauth2/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users.me`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, "content-type": "application/json" },
      body: "{}",
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ id: string(), first_name: string(), last_name: string() }) }),
    );
    return { accountInfo: { externalId: data.id, displayName: `${data.first_name} ${data.last_name}` } };
  },
});

// Methods that only read. Everything else changes data and needs approval.
const readSuffix = /^(list|info|current|exchangeRates|getWeekSchedule|listDaysOff|listMessages|getMessage|url|download|me)$/;

const input = object({ body: record(json()).optional() });

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, body: Record<string, unknown> | undefined) => {
    const response = await fetcher(`${base}/${method}`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const groups = Object.entries(resources).map(([resource, actions]) => {
    const entries = actions.map((action) => {
      const method = `${resource}.${action}`;
      const options = {
        description: `POST /${method}. Pass the documented request fields in body (for example id, filter, page: { size, number }, sort).`,
        input,
      };
      const handler = async (_ctx: unknown, args: { body?: Record<string, unknown> }) => call(method, args.body);
      return [action, readSuffix.test(action) ? query(options, handler) : mutation(options, handler)] as const;
    });
    return [resource, router(Object.fromEntries(entries), { title: resource, description: `Teamleader ${resource} methods.` })] as const;
  });
  return router(Object.fromEntries(groups));
}

export default defineApp(
  { user: { accounts: { teamleader: teamleader.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teamleader ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Teamleader Focus",
        description:
          "CRM, deals, quotations, invoices, projects, tasks, calendar, time tracking and tickets. Each tool is one RPC method; send request fields in body.",
        icons,
      },
    ),
  }),
);
