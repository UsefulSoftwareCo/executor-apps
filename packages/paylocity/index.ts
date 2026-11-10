import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Fields = { environment: string; companyId: string; clientId: string; clientSecret: string };

// Production is api.paylocity.com; the sandbox is dc1demogw.paylocity.com. Credentials only go to these two hosts.
function originOf(environment: string): string {
  const env = environment.trim().toLowerCase();
  if (env !== "api" && env !== "dc1demogw")
    throw new Error('Environment must be "api" (production) or "dc1demogw" (sandbox).');
  return `https://${env}.paylocity.com`;
}

const Token = object({ access_token: string(), expires_in: number().optional() });
const tokens = new Map<string, { token: string; expires: number }>();

async function mintToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const cacheKey = `${origin}|${fields.companyId}|${fields.clientId}`;
  const cached = tokens.get(cacheKey);
  if (cached !== undefined && cached.expires > Date.now()) return cached.token;
  const response = await fetcher(`${origin}/IdentityServer/connect/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "WebLinkAPI" }).toString(),
  });
  const token = await decodeJson(response, Token);
  tokens.set(cacheKey, { token: token.access_token, expires: Date.now() + Math.max((token.expires_in ?? 3600) - 120, 60) * 1000 });
  return token.access_token;
}

const paylocity = defineProvider({
  name: "Paylocity",
  hosts: ["api.paylocity.com", "dc1demogw.paylocity.com"],
  auth: {
    // Paylocity issues a client id and secret for the WebLink API (OAuth 2.0 client credentials, no browser flow).
    apiKey: secrets({
      label: "WebLink client credentials",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        companyId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.environment);
    const token = await mintToken(origin, account.fields, fetch, signal);
    const company = encodeURIComponent(account.fields.companyId.trim());
    const response = await fetch(`${origin}/api/v2/companies/${company}/employees?pagesize=1&includetotalcount=false`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return {
      accountInfo: {
        externalId: `${account.fields.environment.trim().toLowerCase()}/${account.fields.companyId.trim()}`,
        displayName: `Company ${account.fields.companyId.trim()}`,
      },
    };
  },
});

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z]+)\}/g)].map((match) => match[1]!).filter((id) => id !== "companyId");
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: unknown) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET" && op.method !== "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.list && ids.length === 1 && ids[0] === "employeeId" && op.name === "listEmployees"
      ? { pagesize: number().optional(), pagenumber: number().optional() }
      : {}),
    query: record(json()).optional(),
    ...(hasBody ? { body: json() } : {}),
  });
  const notes = [
    op.name === "listEmployees" ? "Page with pagesize (default 25) and pagenumber (zero-based)." : "",
    hasBody ? "Pass the JSON request body as body (see the Paylocity API reference)." : "",
    "Other query parameters go in query.",
  ].filter((text) => text !== "");
  const description = `${op.description} ${notes.join(" ")}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    const search: Params = { ...((args.query as Params | undefined) ?? {}) };
    for (const key of ["pagesize", "pagenumber"]) if (args[key] !== undefined) search[key] = args[key];
    return call(op, path, search, hasBody ? args.body : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const origin = originOf(fields.environment);
  const company = encodeURIComponent(fields.companyId.trim());
  const call = async (op: Operation, path: string, search: Params, body: unknown) => {
    const url = new URL(`${origin}${path.replace("{companyId}", company)}`);
    for (const [name, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(name, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${await mintToken(origin, fields, fetcher, signal)}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    if (response.status === 401) tokens.clear();
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { paylocity: paylocity.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.paylocity ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Paylocity",
        description:
          "Paylocity WebLink API: employees, earnings, deductions, local and state taxes, direct deposit, pay statements, onboarding and company codes.",
        instructions:
          "companyId comes from the connected account. Employee-scoped tools take employeeId. Dates in paths are yyyy-MM-dd. Paylocity limits API access by the resources granted to the client credentials; a 403 means that resource was not granted.",
        icons,
      },
    ),
  }),
);
