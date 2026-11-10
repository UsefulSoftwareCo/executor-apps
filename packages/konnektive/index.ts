import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { endpoints } from "./endpoints.js";
import { icons } from "./icon.js";

const origin = "https://api.konnektive.com";

type Account = { fields: { loginId: string; password: string } };

// Konnektive accepts GET or POST. The credentials go in a POST form body so they stay out of URLs and logs.
async function call(
  account: Account,
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
  path: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || key === "loginId" || key === "password") continue;
    form.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  form.set("loginId", account.fields.loginId);
  form.set("password", account.fields.password);
  const response = await fetcher(`${origin}${path}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form.toString(),
  });
  return decodeJson(response, json());
}

const konnektive = defineProvider({
  name: "Konnektive",
  hosts: ["api.konnektive.com"],
  auth: {
    apiUser: secrets({
      label: "API user",
      fields: object({ loginId: plain(string({ minLength: 1 })), password: string({ minLength: 1 }) }),
    }),
  },
  // Campaign query is read-only; Konnektive answers bad credentials with HTTP 200 and result "ERROR".
  async health({ account, fetch, signal }) {
    const body = new URLSearchParams({ loginId: account.fields.loginId, password: account.fields.password });
    const response = await fetch(`${origin}/campaign/query/`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
    });
    const parsed = (await decodeJson(response, json())) as { result?: string; message?: unknown };
    if (parsed.result === "ERROR") throw new Error(`Konnektive rejected the API user: ${JSON.stringify(parsed.message)}`);
  },
});

const input = object({
  params: record(json()),
});

const konnektiveTools = (account: Account, signal: AbortSignal) =>
  router(
    Object.fromEntries(
      endpoints.map((endpoint) => {
        const config = {
          description: `${endpoint.description} Pass the fields in params; loginId and password are added for you.`,
          input,
        };
        const run = async ({ fetch }: { fetch: typeof globalThis.fetch }, { params }: { params: Record<string, unknown> }) => {
          const missing = endpoint.required.filter((name) => params[name] === undefined);
          if (missing.length > 0) throw new Error(`Missing required params: ${missing.join(", ")}`);
          return call(account, fetch, signal, endpoint.path, params);
        };
        return [
          endpoint.key,
          endpoint.kind === "query"
            ? query(config, run)
            : mutation({ ...config, approval: always() }, run),
        ];
      }),
    ),
  );

export default defineApp(
  { user: { accounts: { konnektive: konnektive.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.konnektive ?? [], (account) => konnektiveTools(account, signal), { signal }),
      {
        title: "Konnektive",
        description:
          "Konnektive CRM for direct-response e-commerce: import leads and orders, query customers, transactions, purchases and club members, manage products, campaigns, gateways, coupons, affiliates and reports.",
        icons,
      },
    ),
  }),
);
