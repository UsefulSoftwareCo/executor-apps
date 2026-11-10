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

const base = "https://api.referralrock.com";

const referralrock = defineProvider({
  name: "Referral Rock",
  hosts: ["api.referralrock.com"],
  auth: {
    // The API uses HTTP Basic: public key as username, private key as password.
    apiKey: secrets({
      label: "API keys",
      fields: object({ publicKey: string({ minLength: 1 }), privateKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/programs?count=1`, {
      signal,
      headers: { Authorization: authorization(account.fields) },
    });
    await decodeJson(response, object({}));
  },
});

function authorization(keys: { publicKey: string; privateKey: string }) {
  return `Basic ${btoa(`${keys.publicKey}:${keys.privateKey}`)}`;
}

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "DELETE";
type Params = Record<string, unknown>;

function client(keys: { publicKey: string; privateKey: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: authorization(keys),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());

// Reads take optional `query` parameters (programId, query, offset, count, ...) and path ids.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }),
    },
    async (_ctx, input: Params) => call("GET", resolve(path, input, ids), (input.query as Params | undefined) ?? {}),
  );
}

// Writes take a JSON `body`; DELETE variants take only `query`.
function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, hasBody = true) {
  return mutation(
    { description, input: object({ query: filters, ...(hasBody ? { body: payload } : {}) }) },
    async (_ctx, input: Params) =>
      call(method, path, (input.query as Params | undefined) ?? {}, hasBody ? (input.body as Params) : undefined),
  );
}

function resolve(path: string, input: Params, ids: readonly string[]) {
  return ids.reduce((acc, id) => acc.replace(`{${id}}`, encodeURIComponent(String(input[id]))), path);
}

const queryRef =
  "Query objects identify a record by primaryInfo (email) or by both secondaryInfo and tertiaryInfo; the record changes only if the query matches exactly one.";

function build(call: Call) {
  return router({
    programs: router(
      {
        list: read(call, "/api/programs", "List referral programs. query: programId, offset, count."),
        get: read(call, "/api/program/getsingle", "Get one program. query.name is the program name."),
      },
      { title: "Programs", description: "Referral programs." },
    ),
    members: router(
      {
        list: read(call, "/api/members", "List members, newest first. query: programId (id, name or title), query (email, id, external id or referral code), showDisabled, sort, dateFrom, dateTo, offset, count."),
        create: write(call, "POST", "/api/members", "Create a member and add them to a program. body is the member object (programId, firstName, lastName, email, ...)."),
        update: write(call, "POST", "/api/members/update", `Update members. body holds query and member objects. ${queryRef}`),
        remove: write(call, "POST", "/api/members/remove", `Delete members. body holds query objects. ${queryRef}`),
        stats: read(call, "/api/memberstats/getsingle", "Sharing, referral and reward statistics for a member. query: query (email, id, external id or referral code) and timePeriod (All, MonthToDate, LastMonth, Last7Days, Last30Days), both required."),
        accessUrls: write(call, "POST", "/api/memberaccessurls", "Return a member's share links and access links for the portal or share widget."),
      },
      { title: "Members", description: "Program members (referrers)." },
    ),
    referrals: router(
      {
        list: read(call, "/api/referrals", "List referrals, newest first. query: programId, query, memberId, sort, dateFrom, dateTo, status (pending, qualified, approved, denied, ...), offset, count."),
        get: read(call, "/api/referral/single", "Get one referral. query needs at least one of email, referralId or externalId."),
        create: write(call, "POST", "/api/referrals", "Add a referral to a program using a member's referral code."),
        update: write(call, "POST", "/api/referral/update", `Update referrals. body holds query and referral objects. ${queryRef}`),
        updateStatus: write(call, "POST", "/api/referrals/status", "Update a referral's status. Deprecated by Referral Rock; prefer update."),
        remove: write(call, "POST", "/api/referral/remove", `Delete referrals. body holds query objects. ${queryRef}`),
        createAction: write(call, "POST", "/api/referralaction", "Create a referral action used to process new recurring rewards."),
      },
      { title: "Referrals", description: "Referred leads and customers." },
    ),
    rewards: router(
      {
        list: read(call, "/api/rewards", "List rewards, newest first. query: programId, memberId, query, status (Pending, Processing, Issued), sort, dateFrom, dateTo, offset, count."),
        create: write(call, "POST", "/api/rewards", "Create rewards for members and referrals of a program."),
        update: write(call, "POST", "/api/rewards/update", "Update rewards."),
        issue: write(call, "POST", "/api/rewards/issue", "Issue a specific reward."),
        remove: write(call, "POST", "/api/rewards/remove", "Delete a reward from a member or referral."),
        rules: read(call, "/api/rewardrules", "List member reward rules."),
      },
      { title: "Rewards", description: "Rewards and reward rules." },
    ),
    payouts: router(
      {
        list: read(call, "/api/payouts/{id}", "List payouts for an id.", ["id"]),
        pending: read(call, "/api/payouts/pending", "List payouts not yet transferred. query: recipientId, includeIneligible."),
        transactions: read(call, "/api/payouts/transactions", "List payout transactions. query: recipient or transactionId."),
        issue: write(call, "POST", "/api/payouts/transactions", "Pay out pending rewards; returns the transactions of issued rewards."),
      },
      { title: "Payouts", description: "Pending payouts and transactions." },
    ),
    customerFeed: router(
      {
        add: write(call, "POST", "/api/customerfeed", "Add a customer: matching referrals become approved (triggering rewards) and the customer is added as a preloaded member."),
        addMany: write(call, "POST", "/api/customerfeeds", "Add many customers in one call; the response reports each record's outcome in order."),
        invite: write(call, "POST", "/api/invitefeed", "Add a contact for automatic invites. Deprecated by Referral Rock; prefer customerFeed.add."),
      },
      { title: "Customer feed", description: "Approve referrals and add members from your customer data." },
    ),
    webhooks: router(
      {
        subscribe: write(call, "POST", "/api/hooks", "Subscribe a URL to an event; Referral Rock POSTs matching records to it."),
        unsubscribe: write(call, "DELETE", "/api/hooks", "Unsubscribe a URL from an event. query identifies the subscription.", false),
        history: read(call, "/api/v2/hooks/history/{eventName}", "Recent events in webhook shape, newest first (about 7 days, up to 5000). query: count.", ["eventName"]),
      },
      { title: "Webhooks", description: "Event subscriptions and event history." },
    ),
    email: router(
      {
        unsubscribed: read(call, "/api/email/getunsubscribed", "List unsubscribed email addresses, or look one up with query.email."),
        unsubscribe: write(call, "POST", "/api/email/unsubscribe", "Unsubscribe an email address."),
        resubscribe: write(call, "POST", "/api/email/removeunsubscribe", "Remove an email address from the unsubscribe list."),
      },
      { title: "Email", description: "Unsubscribe list." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { referralrock: referralrock.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.referralrock ?? [],
        (account) => withApprovals(build(client(account.fields, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Referral Rock",
        description:
          "Referral marketing: programs, members, referrals, rewards, payouts, customer feed, webhooks and email unsubscribes. Pass filters in query and fields in body, as in the Referral Rock API reference.",
        icons,
      },
    ),
  }),
);
