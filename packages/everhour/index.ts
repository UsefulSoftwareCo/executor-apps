import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { routes } from "./routes.js";

const base = "https://api.everhour.com";
const docs = "https://everhour.docs.apiary.io";

const everhour = defineProvider({
  name: "Everhour",
  hosts: ["api.everhour.com"],
  auth: {
    // The key is at the bottom of the profile page (app.everhour.com/#/account/profile).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me`, {
      signal,
      headers: { "X-Api-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, search: Record<string, unknown>, body: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-Api-Key": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Everhour answered ${response.status}: ${text.slice(0, 1000)}`);
    if (text === "") return { status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { status: response.status, body: text };
    }
  };
}

const enc = encodeURIComponent;

function build(call: ReturnType<typeof client>) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, name, method, path, pathParams, queryParams, description] of routes) {
    const fields: Record<string, unknown> = {};
    for (const p of pathParams) fields[p] = string({ minLength: 1 });
    for (const p of queryParams) fields[p] = string().optional();
    const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
    if (hasBody) fields["body"] = json().optional();
    const note = hasBody ? " Pass the JSON request payload in body (see the docs for its fields)." : "";
    const options = {
      description: `${description}.${note} ${method} ${path.split("?")[0]}. Docs: ${docs}`,
      input: object(fields as never),
    };
    const run = async (_ctx: unknown, input: Record<string, unknown>) => {
      let resolved = path;
      for (const p of pathParams) resolved = resolved.replace(`{${p}}`, enc(String(input[p])));
      const search: Record<string, unknown> = {};
      for (const p of queryParams) search[p] = input[p];
      return call(method, resolved, search, hasBody ? input["body"] : undefined);
    };
    const operation = method === "GET" ? query(options as never, run as never) : mutation(options as never, run as never);
    const members = groups.get(group) ?? {};
    members[name] = operation;
    groups.set(group, members);
  }
  return router(
    Object.fromEntries(
      [...groups].map(([group, members]) => [
        group,
        router(members as never, { title: group, description: `Everhour ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { everhour: everhour.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.everhour ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Everhour",
        description: "Time tracking with Everhour: projects, tasks, time records, timers, clients, invoices, expenses, resource planning, timesheets, reports and webhooks.",
        icons,
      },
    ),
  }),
);
