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

const base = "https://api.laposta.nl";
const docs = "https://api.laposta.nl/doc/";

const laposta = defineProvider({
  name: "Laposta",
  hosts: ["api.laposta.nl"],
  auth: {
    // Created in the Laposta account (see docs.laposta.nl article 349). Sent as the HTTP Basic username with an empty password.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/list`, { signal, headers: { Authorization: basic(account.fields.token) } });
    await decodeJson(response, object({}));
  },
});

function basic(token: string) {
  return `Basic ${btoa(`${token}:`)}`;
}

type Fetch = typeof fetch;

// Laposta reads nested input in PHP bracket notation: from[name]=x, list_ids[]=y.
function encode(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) encode(params, `${key}[]`, item);
  } else if (typeof value === "object") {
    for (const [name, inner] of Object.entries(value)) encode(params, `${key}[${name}]`, inner);
  } else {
    params.append(key, String(value));
  }
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (
    method: string,
    path: string,
    search: Record<string, unknown>,
    body: Record<string, unknown>,
    asJson = false,
  ) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) encode(url.searchParams, key, value);
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) encode(form, key, value);
    const hasBody = method === "POST";
    const payload = asJson ? JSON.stringify(Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))) : form.toString();
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: basic(token),
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": asJson ? "application/json" : "application/x-www-form-urlencoded" } : {}),
      },
      body: hasBody ? payload : undefined,
    });
    return decodeResponse(response);
  };
}

async function decodeResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!response.ok) throw new Error(`Laposta answered ${response.status}: ${text.slice(0, 1000)}`);
  if (text === "") return { status: response.status };
  return JSON.parse(text) as unknown;
}

const enc = encodeURIComponent;
// Laposta wants a literal '+' in an email-as-member_id path segment sent as %252B.
const encPath = (value: string) => enc(value).replaceAll("%2B", "%252B");

function build(call: ReturnType<typeof client>, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, name, method, path, pathParams, queryParams, requiredBody, optionalBody, description] of routes) {
    const fields: Record<string, unknown> = {};
    for (const p of pathParams) fields[p] = string({ minLength: 1 });
    for (const p of queryParams) fields[p] = p === "list_id" ? string({ minLength: 1 }) : string().optional();
    for (const p of requiredBody) fields[p] = json();
    for (const p of optionalBody) fields[p] = json().optional();
    const options = { description: `${description} ${method} ${path}. Docs: ${docs}`, input: object(fields as never) };
    const run = async (_ctx: unknown, input: Record<string, unknown>) => {
      let resolved = path;
      for (const p of pathParams) resolved = resolved.replace(`{${p}}`, encPath(String(input[p])));
      const search: Record<string, unknown> = {};
      for (const p of queryParams) search[p] = input[p];
      const body: Record<string, unknown> = {};
      for (const p of [...requiredBody, ...optionalBody]) body[p] = input[p];
      // The vendor documents JSON for field updates (options_full is an id to label map).
      return call(method, resolved, search, body, group === "fields" && name === "update");
    };
    const operation = method === "GET" ? query(options as never, run as never) : mutation(options as never, run as never);
    const members = groups.get(group) ?? {};
    members[name] = operation;
    groups.set(group, members);
  }
  const bulk = mutation(
    {
      description:
        "Bulk sync members into a list (paid accounts only). actions is an array of add, update and unsubscribe_excluded (the last unsubscribes every member not in the request). members is 1 to 500000 objects, each with member_id and/or email, plus optional custom_fields (keyed by custom_name) and source_url. Returns a report with provided, errors, skipped, edited and added counts. POST /v2/list/{list_id}/members. Docs: https://api.laposta.nl/doc/",
      input: object({ list_id: string({ minLength: 1 }), actions: json(), members: json() }),
    },
    async (_ctx: unknown, input: { list_id: string; actions: unknown; members: unknown }) => {
      const response = await fetcher(`${base}/v2/list/${encPath(input.list_id)}/members`, {
        method: "POST",
        signal,
        headers: { Authorization: basic(token), Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ actions: input.actions, members: input.members }),
      });
      return decodeResponse(response);
    },
  );
  (groups.get("members") as Record<string, unknown>)["bulk_sync"] = bulk;
  return router(
    Object.fromEntries(
      [...groups].map(([group, members]) => [
        group,
        router(members as never, { title: group, description: `Laposta ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { laposta: laposta.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.laposta ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal), account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Laposta",
        description: "Dutch email marketing with Laposta: lists, fields, segments, members, webhooks, campaigns and reports.",
        icons,
      },
    ),
  }),
);
