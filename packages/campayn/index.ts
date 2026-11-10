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

const base = "https://campayn.com/api/v1";

const campayn = defineProvider({
  name: "Campayn",
  hosts: ["campayn.com"],
  auth: {
    // The key is under Settings > Account > API key; Campayn has no OAuth.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/lists.json`, {
      signal,
      headers: { Authorization: `TRUEREST apikey=${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
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
        Authorization: `TRUEREST apikey=${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Campayn answered ${response.status}: ${text.slice(0, 1000)}`);
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
    const hasBody = method === "POST" || method === "PUT";
    if (hasBody) fields["body"] = json();
    const options = {
      description: `${description} ${method} /api/v1${path}.${hasBody ? " Pass the JSON request payload in body." : ""}`,
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
        router(members as never, { title: group, description: `Campayn ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { campayn: campayn.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.campayn ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Campayn",
        description: "Email marketing with Campayn: contact lists, contacts, signup forms, emails and email reports.",
        icons,
      },
    ),
  }),
);
