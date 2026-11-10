import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://app.viral-loops.com/api/v3";

const viralloops = defineProvider({
  name: "Viral Loops",
  hosts: ["app.viral-loops.com"],
  auth: {
    // The secret API token of one campaign, for one campaign (the vendor docs link to "Where to find it?" without a stable page; see README).
    // It is sent in the apiToken request header.
    apiKey: secrets({
      label: "Campaign API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/campaign/stats`, {
      signal,
      headers: { apiToken: account.fields.token },
    });
    await decodeJson(response, object({ leadCount: number(), referralCountTotal: number() }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, search: Params, body: Params | undefined) => Promise<unknown>) {
  const hasBody = op.method !== "GET";
  const input = object({
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) =>
    call(op, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, search: Params, body: Params | undefined) => {
    // The vendor's PUT schema also lists apiToken as a required body property.
    const payload = op.method === "PUT" ? { apiToken: token, ...(body ?? {}) } : body;
    const target = new URL(`${base}${op.path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: {
        apiToken: token,
        Accept: "application/json",
        ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { viralloops: viralloops.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.viralloops ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Viral Loops",
        description:
          "Viral Loops referral marketing: campaign info and stats, participants, referrals, conversions, ranks, flags and rewards.",
        icons,
      },
    ),
  }),
);
