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
import { operations, type Operation } from "./operations.js";

const base = "https://api.clearout.io/v2";

const clearout = defineProvider({
  name: "Clearout",
  hosts: ["api.clearout.io"],
  auth: {
    // Created under Developer > API > Create API Token in the Clearout app; sent as a Bearer token.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/credits`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, input: Params) => Promise<unknown>) {
  const input = object({ params: record(json()).optional() });
  const where = op.method === "GET" ? "query string" : "JSON body";
  const description = `${op.description} Pass the ${where} fields as params.`;
  const run = async (_ctx: unknown, args: Params) => call(op, (args.params as Params | undefined) ?? {});
  // Reverse lookup GETs can return 402 Payment Required and the docs do not say whether they consume credits, so they require approval.
  const readOnly = op.method === "GET" && op.group !== "reverseLookup";
  return readOnly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, input: Params) => {
    const missing = (op.required ?? []).filter((key) => input[key] === undefined);
    if (missing.length > 0) throw new Error(`Missing required field(s) in params: ${missing.join(", ")}`);
    const target = new URL(`${base}${op.path}`);
    if (op.method === "GET") {
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
      }
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(op.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(op.method === "POST" ? { body: JSON.stringify(input) } : {}),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { clearout: clearout.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clearout ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Clearout",
        description:
          "Verify and find email addresses with Clearout: instant and bulk email verification, email finder, reverse lookup, name validation, domain MX/Whois and account credits.",
        icons,
      },
    ),
  }),
);
