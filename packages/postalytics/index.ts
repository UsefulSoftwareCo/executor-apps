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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const root = "https://api.postalytics.com";

// The API key is the Basic username with an empty password.
function authorization(token: string) {
  return { Authorization: `Basic ${btoa(`${token}:`)}` };
}

const postalytics = defineProvider({
  name: "Postalytics",
  hosts: ["api.postalytics.com"],
  auth: {
    // Find the key in Postalytics under Account > Connect > API Key.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${root}/api/v1/account/me`, {
      signal,
      headers: authorization(account.fields.token),
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function paramSchema(type: "s" | "n" | "j", required: boolean | undefined) {
  const schema = type === "s" ? string() : type === "n" ? number() : json();
  return required ? schema : schema.optional();
}

function tool(op: Operation, call: (op: Operation, args: Params) => Promise<unknown>) {
  const input = object(Object.fromEntries(op.params.map((p) => [p.name, paramSchema(p.type, p.required)])));
  const run = async (_ctx: unknown, args: Params) => call(op, args);
  const description = op.description;
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, args: Params) => {
    let path = op.path;
    const search = new URLSearchParams();
    let body: unknown;
    for (const param of op.params) {
      const value = args[param.name];
      if (value === undefined || value === null) continue;
      if (param.in === "path") path = path.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      else if (param.in === "query") search.set(param.name, String(value));
      else body = value;
    }
    const qs = search.size > 0 ? `?${search}` : "";
    const response = await fetcher(`${root}${path}${qs}`, {
      method: op.method,
      signal,
      headers: {
        ...authorization(token),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { postalytics: postalytics.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postalytics ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Postalytics",
        description:
          "Postalytics direct mail automation: campaigns, templates, contact lists, flows, triggered sends, suppression lists, webhooks and sub-accounts.",
        icons,
        instructions:
          "Create and proof a template, then a campaign, before sending. Triggered sends need the campaign's endpoint ID from campaigns.drips. Mutation bodies use snake_case JSON field names.",
      },
    ),
  }),
);
