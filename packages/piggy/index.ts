import {
  accountRouter,
  boolean,
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
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { endpoints, type Endpoint } from "./endpoints.js";

// Piggy rebranded to Leat; the API moved from api.piggy.eu to api.leat.com (https://docs.leat.com/v3).
const base = "https://api.leat.com/api/v3/oauth/clients";

const piggy = defineProvider({
  name: "Piggy",
  hosts: ["api.leat.com"],
  auth: {
    apiKey: secrets({
      label: "Personal Access Token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/shops?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

function schemaFor(type: string): Schema<unknown> {
  if (type === "s") return string();
  if (type === "n") return number();
  if (type === "b") return boolean();
  return json();
}

function appendQuery(search: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) value.forEach((item) => appendQuery(search, `${key}[]`, item));
  else if (typeof value === "object") for (const [k, v] of Object.entries(value)) appendQuery(search, `${key}[${k}]`, v);
  else search.append(key, String(value));
}

function tool(endpoint: Endpoint, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const pathParams = [...endpoint.p.matchAll(/\{([A-Za-z_]+)\}/g)].map((match) => match[1]!);
  const fields: Record<string, Schema<unknown, boolean>> = {};
  for (const name of pathParams) fields[name] = string({ minLength: 1 });
  for (const [name, type, required] of endpoint.f) {
    const schema = schemaFor(type);
    fields[name] = required ? schema : schema.optional();
  }
  const input = object(fields);
  const handler = async (_ctx: unknown, args: Record<string, unknown>) => {
    let path = endpoint.p;
    for (const name of pathParams) path = path.replace(`{${name}}`, encodeURIComponent(String(args[name])));
    const rest = Object.entries(args).filter(([name, value]) => !pathParams.includes(name) && value !== undefined);
    const hasBody = endpoint.m === "POST" || endpoint.m === "PUT";
    const search = new URLSearchParams();
    if (!hasBody) for (const [name, value] of rest) appendQuery(search, name, value);
    const url = `${base}${path}${search.size > 0 ? `?${search}` : ""}`;
    const response = await fetcher(url, {
      method: endpoint.m,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(Object.fromEntries(rest)) } : {}),
    });
    return decodeJson(response, json());
  };
  const options = { description: endpoint.d, input };
  // The handler receives the parsed input object; its shape is built from the documented fields.
  return endpoint.k === "query"
    ? query(options, handler as never)
    : mutation(options, handler as never);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const groups = Object.fromEntries(
    Object.entries(endpoints).map(([key, group]) => [
      key,
      router(
        Object.fromEntries(Object.entries(group.tools).map(([name, endpoint]) => [name, tool(endpoint, token, fetcher, signal)])),
        { title: group.title },
      ),
    ]),
  );
  return router(groups);
}

export default defineApp(
  { user: { accounts: { piggy: piggy.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.piggy ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), // Every mutation needs approval. Exempt by classification: simulateOrderResult (POST /orders/simulate, creates nothing)
          // and checkVoucherValidity (POST /vouchers/{voucher_uuid}/validate, validates without locking) are queries in endpoints.ts.
          (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Piggy",
        description:
          "Piggy (now Leat) loyalty platform: contacts, credit receptions, rewards, vouchers, giftcards, prepaid balances, orders, promotions, shops and webhooks.",
        icons,
      },
    ),
  }),
);
