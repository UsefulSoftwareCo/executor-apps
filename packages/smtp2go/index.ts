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

const base = "https://api.smtp2go.com/v3";

const smtp2go = defineProvider({
  name: "SMTP2GO",
  hosts: ["api.smtp2go.com", "us-api.smtp2go.com", "eu-api.smtp2go.com", "au-api.smtp2go.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Available to every API key regardless of its endpoint permissions.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api_keys/permissions`, {
      method: "POST",
      signal,
      headers: { "X-Smtp2go-Api-Key": account.fields.token, "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });
    await decodeJson(response, object({}));
  },
});

function tool(op: Operation, call: (op: Operation, body: Record<string, unknown>) => Promise<unknown>) {
  const input = object({ body: record(json()).optional() });
  const description = `${op.description} Pass the JSON request body as body; do not include api_key.`;
  const run = async (_ctx: unknown, args: { body?: Record<string, unknown> }) => call(op, args.body ?? {});
  return op.readonly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, body: Record<string, unknown>) => {
    const response = await fetcher(`${base}${op.path}`, {
      method: op.method,
      signal,
      headers: { "X-Smtp2go-Api-Key": token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { smtp2go: smtp2go.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.smtp2go ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SMTP2GO",
        description:
          "Send email and SMS with SMTP2GO and manage sender domains, SMTP users, API keys, templates, webhooks, suppressions, activity and statistics.",
        instructions:
          "Every tool takes the vendor's JSON request body as body (the API key is added for you). Send email with email.send (sender and to are required; to is an array of \"Name <addr@example.com>\"). The sender must be a verified domain or single sender email.",
        icons,
      },
    ),
  }),
);
