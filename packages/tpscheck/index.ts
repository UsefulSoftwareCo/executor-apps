import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.tpscheck.uk";

const tpscheck = defineProvider({
  name: "TPSCheck",
  hosts: ["api.tpscheck.uk"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /credits needs a valid key and does not spend a check credit.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ plan: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Token ${account.fields.token}`,
  Accept: "application/json",
});

const tpscheckTools = (account: Account, signal: AbortSignal) =>
  router({
    check: mutation(
      {
        description:
          "Check one UK phone number against the TPS and CTPS registers. Returns the E.164 number, validity, line type, original carrier, location, reachability and the tps and ctps flags (v2 format; Business and Enterprise plans also get a risk score). Spends one billable credit.",
        input: object({ phone: string({ minLength: 1 }) }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/check?version=2`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    batch: mutation(
      {
        description:
          "Check up to 100 UK phone numbers in one request against the TPS and CTPS registers (v2 format). Documented as Pro and above (the vendor's Bulk Checking section also lists Starter). Returns total and a results array shaped like check. Spends one credit per number.",
        input: object({ phones: array(string({ minLength: 1 })) }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/batch?version=2`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    credits: query(
      {
        description:
          "Get the account's usage this month: requests_used, requests_remaining, monthly_limit, plan and reset_date. Does not spend a credit.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/credits`, { signal, headers: headers(account) }), json()),
    ),
    status: query(
      {
        description: "Check TPSCheck API health and version. Public endpoint; needs no credit.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/status`, { signal, headers: { Accept: "application/json" } }), json()),
    ),
  });

export default defineApp({ user: { accounts: { tpscheck: tpscheck.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.tpscheck ?? [],
      (account) =>
        withApprovals(tpscheckTools(account, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
      { signal },
    ),
    {
    title: "TPSCheck",
    description: "Check UK phone numbers against the TPS and CTPS do-not-call registers, singly or in batches, and read account credits.",
    icons,
    },
  ),
}));
