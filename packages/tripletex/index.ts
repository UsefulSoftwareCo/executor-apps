import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const WhoAmI = object({ value: object({ companyId: number() }) });
const Session = object({ value: object({ token: string() }) });

// Session tokens are created from the consumer and employee tokens and last until expirationDate.
const createSession = async (
  fields: { consumerToken: string; employeeToken: string },
  fetch: typeof globalThis.fetch,
  signal?: AbortSignal,
) => {
  const expires = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    consumerToken: fields.consumerToken,
    employeeToken: fields.employeeToken,
    expirationDate: expires,
  });
  const response = await fetch(`https://tripletex.no/v2/token/session/:create?${query}`, {
    method: "PUT",
    signal,
    headers: { accept: "application/json" },
  });
  return (await decodeJson(response, Session)).value.token;
};

const tripletex = defineProvider({
  name: "Tripletex",
  hosts: ["tripletex.no"],
  auth: {
    apiKey: secrets({
      label: "Consumer token and employee token",
      fields: object({ consumerToken: string({ minLength: 1 }), employeeToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // The provider health context has no cache, so the session exchange runs once per check;
    // whoAmI is then a read-only call that proves the session token works.
    const token = await createSession(account.fields, fetch, signal);
    const response = await fetch("https://tripletex.no/v2/token/session/>whoAmI?fields=companyId", {
      signal,
      headers: { accept: "application/json", authorization: `Basic ${btoa(`0:${token}`)}` },
    });
    await decodeJson(response, WhoAmI);
  },
});

export default defineApp(
  { user: { accounts: { tripletex: tripletex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tripletex ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["session"],
              schema: string(),
              freshFor: "12 hours", // tokens are requested for two days
              load: async ({ fetch, signal }) => createSession(account.fields, fetch, signal),
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Basic ${btoa(`0:${await token()}`)}`);
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["session"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Tripletex",
        description:
          "Tripletex accounting: customers, suppliers, products, orders, invoices, ledger, projects, timesheets, salary and travel expenses.",
        icons,
      },
    ),
  }),
);
