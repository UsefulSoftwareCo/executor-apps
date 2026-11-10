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

const base = "https://app.klipfolio.com/api/1.0";
const docs = "https://apidocs.klipfolio.com/reference/getting-started";

const klipfolio = defineProvider({
  name: "Klipfolio",
  hosts: ["app.klipfolio.com"],
  auth: {
    // Created in Klipfolio under Integrations > API Keys; sent in the kf-api-key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/profile`, {
      signal,
      headers: { "kf-api-key": account.fields.token, Accept: "application/json" },
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
        "kf-api-key": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Klipfolio answered ${response.status}: ${text.slice(0, 1000)}`);
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
    const hasBody = method !== "GET";
    if (hasBody) fields["body"] = json().optional();
    const note = hasBody ? " Pass the JSON request payload in body." : "";
    const options = {
      description: `${description}${note} ${method} ${path}. Docs: ${docs}`,
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
        router(members as never, { title: group, description: `Klipfolio ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { klipfolio: klipfolio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.klipfolio ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Klipfolio",
        description:
          "Manage Klipfolio business intelligence: Klips, dashboards, data sources and instances, client accounts, users, groups and roles.",
        instructions:
          "Lists return at most 25 items by default; page with limit (max 100) and offset. Pass client_id to act inside a client account. The API allows 5 requests per second.",
        icons,
      },
    ),
  }),
);
