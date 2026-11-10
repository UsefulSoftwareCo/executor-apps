import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://updown.io/api";

type Params = Record<string, unknown>;
type Fetch = typeof fetch;

interface Operation {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
}

// Operations from https://updown.io/api. Path placeholders are {token} or {id}.
const operations: Operation[] = [
  { group: "checks", name: "list", method: "GET", path: "/checks", description: "List all checks." },
  {
    group: "checks",
    name: "get",
    method: "GET",
    path: "/checks/{token}",
    description: "Show one check. Query options: metrics (true) adds last-hour metrics, results (true) adds the last 5 request results.",
  },
  {
    group: "checks",
    name: "downtimes",
    method: "GET",
    path: "/checks/{token}/downtimes",
    description: "List downtimes of a check, newest first, 100 per page. Query options: page, results (true).",
  },
  {
    group: "checks",
    name: "metrics",
    method: "GET",
    path: "/checks/{token}/metrics",
    description: "Detailed metrics for a check (uptime, apdex, timings in ms). Query options: from, to (times), group ('time' or 'host').",
  },
  {
    group: "checks",
    name: "create",
    method: "POST",
    path: "/checks",
    description:
      "Create a check. Body fields: url, type (https, http, icmp, pulse, tcp, tcps), period (seconds: 15, 30, 60, 120, 300, 600, 1800, 3600), apdex_t, enabled, published, alias, string_match, mute_until, http_verb, http_body, disabled_locations (array), recipients (array of recipient ids), custom_headers (object).",
  },
  {
    group: "checks",
    name: "update",
    method: "PUT",
    path: "/checks/{token}",
    description: "Update a check. Body takes the same optional fields as creating a check.",
  },
  { group: "checks", name: "delete", method: "DELETE", path: "/checks/{token}", description: "Delete a check." },
  { group: "nodes", name: "list", method: "GET", path: "/nodes", description: "List all updown.io monitoring servers keyed by name." },
  { group: "nodes", name: "ips", method: "GET", path: "/nodes/ips", description: "List IP addresses (IPv4 and IPv6) of all updown.io servers." },
  { group: "nodes", name: "ipv4", method: "GET", path: "/nodes/ipv4", description: "List IPv4 addresses of all updown.io servers." },
  { group: "nodes", name: "ipv6", method: "GET", path: "/nodes/ipv6", description: "List IPv6 addresses of all updown.io servers." },
  { group: "recipients", name: "list", method: "GET", path: "/recipients", description: "List the alert recipients and channels on the account." },
  {
    group: "recipients",
    name: "create",
    method: "POST",
    path: "/recipients",
    description:
      "Add a recipient. Body: type (email, sms, webhook, slack_compatible, msteams), value (address, number or URL), name (optional, webhooks), selected (optional, default true: select on all existing checks).",
  },
  { group: "recipients", name: "delete", method: "DELETE", path: "/recipients/{id}", description: "Delete a recipient by id." },
  { group: "statusPages", name: "list", method: "GET", path: "/status_pages", description: "List status pages." },
  {
    group: "statusPages",
    name: "create",
    method: "POST",
    path: "/status_pages",
    description:
      "Add a status page. Body: checks (array of check tokens, required), name, description, visibility (public, protected, private), access_key.",
  },
  {
    group: "statusPages",
    name: "update",
    method: "PUT",
    path: "/status_pages/{token}",
    description: "Update a status page. Body takes the same optional fields as creating one.",
  },
  { group: "statusPages", name: "delete", method: "DELETE", path: "/status_pages/{token}", description: "Delete a status page." },
];

const updown = defineProvider({
  name: "Updown.io",
  hosts: ["updown.io"],
  auth: {
    // The API key is shown on https://updown.io/settings/edit; a read-only key also works for GET tools.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/recipients`, {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    await decodeJson(response, json());
  },
});

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET"
    ? query({ description: op.description, input }, run)
    : mutation({ description: op.description, input }, run);
}

function rest(apiKey: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { updown: updown.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.updown ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Updown.io",
        description: "Website monitoring with Updown.io: checks, downtimes, metrics, alert recipients, status pages and monitoring node IPs.",
        icons,
      },
    ),
  }),
);
