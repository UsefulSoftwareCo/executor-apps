import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const origin = "https://gateway.prod.bill.com";
const Login = object({ sessionId: string() });

type Fetch = typeof fetch;
type Credentials = { username: string; password: string; organizationId: string; devKey: string };

async function login(fetcher: Fetch, fields: Credentials, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(`${origin}/connect/v3/login`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      username: fields.username,
      password: fields.password,
      organizationId: fields.organizationId,
      devKey: fields.devKey,
    }),
  });
  const { sessionId } = await decodeJson(response, Login);
  return sessionId;
}

const bill = defineProvider({
  name: "BILL",
  hosts: ["gateway.prod.bill.com"],
  auth: {
    // AP and AR: the developer key plus the sign-in of a BILL user in one organization.
    login: secrets({
      label: "Developer key and BILL sign-in",
      fields: object({
        devKey: string({ minLength: 1 }),
        username: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
        organizationId: string({ minLength: 1 }),
      }),
    }),
    // Spend & Expense API only: a static token created in the BILL web app.
    spendToken: secrets({
      label: "Spend & Expense API token",
      fields: object({ apiToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "spendToken") {
      const response = await fetch(`${origin}/connect/v3/spend/users/current`, {
        signal,
        headers: { apiToken: account.fields.apiToken, accept: "application/json" },
      });
      await decodeJson(response, object({ id: string() }));
      return {};
    }
    const sessionId = await login(fetch, account.fields, signal);
    // Free the API session; it would otherwise stay open until it idles out.
    await fetch(`${origin}/connect/v3/logout`, {
      method: "POST",
      headers: { sessionId, devKey: account.fields.devKey },
    }).catch(() => undefined);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { bill: bill.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bill ?? [],
        (account) => {
          if (account.method === "spendToken") {
            return withApprovals(
              liveOpenapiRouter({
                ...options,
                cache,
                fetch,
                signal,
                account,
                parameterDefaults: { headers: { apiToken: account.fields.apiToken } },
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          }
          // BILL sessions are created by POST /v3/login and idle out after 35 minutes. Sign in on
          // first use and again if BILL reports the session gone.
          let session: Promise<string> | undefined;
          const signIn = () => (session ??= login(fetch, account.fields, signal));
          const withSession: Fetch = async (input, init) => {
            const send = async (id: string) => {
              const headers = new Headers(init?.headers);
              headers.set("sessionId", id);
              headers.set("devKey", account.fields.devKey);
              return fetch(input, { ...init, headers });
            };
            const first = await send(await signIn());
            if (first.status !== 401) return first;
            session = undefined;
            return send(await signIn());
          };
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: withSession, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "BILL",
        description:
          "BILL (bill.com) bills, vendors, payments, invoices, customers, approvals, spend budgets, cards, transactions and reimbursements.",
        icons,
      },
    ),
  }),
);
