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

const base = "https://public.daffy.org/v1";

const daffy = defineProvider({
  name: "Daffy",
  hosts: ["public.daffy.org"],
  auth: {
    // Daffy offers no OAuth for its REST API; users create a key at daffy.org/settings/api.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me`, {
      signal,
      headers: { "X-Api-Key": account.fields.token },
    });
    const me = await decodeJson(response, object({ id: number() }));
    return { accountInfo: { externalId: String(me.id), displayName: `Daffy user ${me.id}` } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "DELETE", path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-Api-Key": token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const page = number().optional();
const segment = (value: string | number) => encodeURIComponent(String(value));

function build(call: Call) {
  return router({
    users: router(
      {
        me: query(
          { description: "Your Daffy profile: id, name, slug, fund and its causes and members.", input: object({}) },
          async () => call("GET", "/users/me"),
        ),
        get: query(
          { description: "Public profile of a user by username (slug).", input: object({ username: string() }) },
          async (_ctx, { username }) => call("GET", `/users/${segment(username)}`),
        ),
        causes: query(
          { description: "Causes a user supports, by numeric user id.", input: object({ userId: number() }) },
          async (_ctx, { userId }) => call("GET", `/users/${segment(userId)}/causes`),
        ),
      },
      { title: "Users", description: "Daffy user profiles." },
    ),
    balance: query(
      {
        description: "Your fund balance: total amount, pending deposits, invested portfolio balance and the amount available to donate now.",
        input: object({}),
      },
      async () => call("GET", "/users/me/balance"),
    ),
    contributions: router(
      {
        list: query(
          {
            description: "Money added to your fund (cards, bank, stock, crypto, checks, wires). Paginated: pass page; meta.last is the final page.",
            input: object({ page }),
          },
          async (_ctx, { page }) => call("GET", "/contributions", { page }),
        ),
      },
      { title: "Contributions", description: "Deposits into your fund." },
    ),
    donations: router(
      {
        list: query(
          {
            description: "Your donations with amounts, status, charity and visibility. Paginated: pass page; meta.last is the final page.",
            input: object({ page }),
          },
          async (_ctx, { page }) => call("GET", "/donations", { page }),
        ),
        listForUser: query(
          {
            description: "Donations of a user by numeric id. For other users only public donations are shown, without amounts.",
            input: object({ userId: number(), page }),
          },
          async (_ctx, { userId, page }) => call("GET", `/users/${segment(userId)}/donations`, { page }),
        ),
        get: query(
          {
            description: "One donation of a user by numeric user id and donation id.",
            input: object({ userId: number(), donationId: number() }),
          },
          async (_ctx, { userId, donationId }) => call("GET", `/users/${segment(userId)}/donations/${segment(donationId)}`),
        ),
        create: mutation(
          {
            description: "Donate from your fund to a charity by EIN (digits only). Moves real money; amount is in USD and at least 10.",
            input: object({
              ein: string({ minLength: 1 }),
              amount: number(),
              note: string().optional(),
              privateMemo: string().optional(),
            }),
          },
          async (_ctx, { ein, amount, note, privateMemo }) =>
            call("POST", "/donations", {}, {
              ein,
              amount,
              ...(note === undefined ? {} : { note }),
              ...(privateMemo === undefined ? {} : { private_memo: privateMemo }),
            }),
        ),
        cancel: mutation(
          {
            description: "Cancel one of your donations before Daffy has accepted or rejected it. Cannot be undone.",
            input: object({ donationId: number() }),
          },
          async (_ctx, { donationId }) => call("DELETE", `/donations/${segment(donationId)}`),
        ),
      },
      { title: "Donations", description: "Grants from your fund to charities." },
    ),
    gifts: router(
      {
        list: query(
          { description: "Daffy gifts you created. Paginated: pass page.", input: object({ page }) },
          async (_ctx, { page }) => call("GET", "/gifts", { page }),
        ),
        get: query(
          { description: "One gift by its code (UUID).", input: object({ code: string({ minLength: 1 }) }) },
          async (_ctx, { code }) => call("GET", `/gifts/${segment(code)}`),
        ),
        create: mutation(
          {
            description: "Create a gift for a person. amount is in USD and at least 18. Returns the gift with a shareable url.",
            input: object({ name: string({ minLength: 1 }), amount: number() }),
          },
          async (_ctx, { name, amount }) => call("POST", "/gifts", {}, { name, amount }),
        ),
      },
      { title: "Gifts", description: "Gifts that let someone else choose a charity." },
    ),
    nonProfits: router(
      {
        get: query(
          { description: "A charity by EIN (digits only): name, location, website, causes and Daffy page.", input: object({ ein: string({ minLength: 1 }) }) },
          async (_ctx, { ein }) => call("GET", `/non_profits/${segment(ein)}`),
        ),
        search: query(
          {
            description: "Search charities by text and/or cause id. Paginated: pass page.",
            input: object({ query: string().optional(), causeId: number().optional(), page }),
          },
          async (_ctx, { query: text, causeId, page }) => call("GET", "/non_profits", { query: text, cause_id: causeId, page }),
        ),
      },
      { title: "Non-profits", description: "Charities that can receive donations." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { daffy: daffy.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.daffy ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Daffy",
        description: "Give with Daffy, the donor-advised fund: fund balance, contributions, donations, gifts, charity search by name or EIN, and user profiles.",
        icons,
      },
    ),
  }),
);
