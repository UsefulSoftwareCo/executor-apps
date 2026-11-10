import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  type Schema,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Concur serves each data center from <geo>.api.concursolutions.com (us, us2, eu, eu2, emea, apj, ...) and
// China from *.api.concursolutions.cn. The "geolocation" returned with a token names the host to use.
const hostPattern = /^[a-z0-9][a-z0-9-]*\.api\.concursolutions\.(com|cn)$/;

function apiHost(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your Concur geolocation host, for example us.api.concursolutions.com.");
  return host;
}

const geolocation = plain(string({ minLength: 1 }));

const sapConcur = defineProvider({
  name: "SAP Concur",
  hosts: ["*.api.concursolutions.com", "*.api.concursolutions.cn"],
  auth: {
    clientCredentials: secrets({
      label: "Company-level app (client credentials)",
      fields: object({
        geolocation,
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
    accessToken: secrets({
      label: "OAuth access token",
      fields: object({ geolocation, accessToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = apiHost(account.fields.geolocation);
    const fields = account as unknown as AccountFields;
    // Minting the token proves a company app's credentials without needing any API scope. A pasted access token
    // cannot be checked that way, so probe a list endpoint and treat 403 (valid token, scope not granted) as healthy.
    const token = await bearer(fields, fetch, signal);
    if (fields.method === "accessToken") {
      const response = await fetch(`https://${host}/api/v3.0/common/lists?limit=1`, {
        signal,
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (response.status === 401) throw new Error("Concur rejected the access token (401); it may have expired.");
      if (!response.ok && response.status !== 403) throw new Error(`Concur health check failed with ${response.status}`);
    }
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

type AccountFields =
  | { method: "clientCredentials"; fields: { geolocation: string; clientId: string; clientSecret: string } }
  | { method: "accessToken"; fields: { geolocation: string; accessToken: string } };

// Client-credentials tokens last an hour and have no refresh token, so mint one when needed and reuse it.
const tokenCache = new Map<string, { token: string; expires: number }>();

async function bearer(account: AccountFields, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  if (account.method === "accessToken") return account.fields.accessToken;
  const host = apiHost(account.fields.geolocation);
  const key = `${host}|${account.fields.clientId}|${account.fields.clientSecret}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const response = await fetcher(`https://${host}/oauth2/v0/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
    }).toString(),
  });
  if (!response.ok) throw new Error(`Concur token request failed with ${response.status}`);
  const body = (await response.json()) as { access_token?: string; expires_in?: string | number };
  if (!body.access_token) throw new Error("Concur token response had no access_token");
  tokenCache.set(key, { token: body.access_token, expires: Date.now() + (Number(body.expires_in) || 3600) * 1000 });
  return body.access_token;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(account: AccountFields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const host = apiHost(account.fields.geolocation);
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const token = await bearer(account, fetcher, signal);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== null) params.set(key, String(value));
    const qs = params.toString();
    const response = await fetcher(`https://${host}/${path.replace(/^\/+/, "")}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return {};
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const id = string({ minLength: 1 });
const seg = (value: string) => encodeURIComponent(value);

function list(call: Call, path: string, description: string, extra: Record<string, Schema<any, boolean>> = {}) {
  return query(
    {
      description: `${description} Pages with limit (default 25, max 100) and offset or the cursor in the response's NextPage.`,
      input: object({ limit: number().optional(), offset: string().optional(), ...extra }),
    },
    async (_ctx, input: Params) => call("GET", path, input),
  );
}

function build(call: Call) {
  return router({
    users: router(
      {
        list: query(
          {
            description: "List users (SCIM, identity v4.1). filter is a SCIM expression, e.g. userName eq \"a@b.com\".",
            input: object({ count: number().optional(), startIndex: number().optional(), filter: string().optional() }),
          },
          async (_ctx, input: Params) => call("GET", "profile/identity/v4.1/Users", input),
        ),
        get: query(
          { description: "Retrieve a user by Concur user id.", input: object({ id }) },
          async (_ctx, input) => call("GET", `profile/identity/v4.1/Users/${seg(input.id)}`),
        ),
        loginInfo: query(
          { description: "Retrieve login ID details for a login.", input: object({ loginId: id }) },
          async (_ctx, input) => call("GET", "api/user/v1.0/loginid", { loginID: input.loginId }),
        ),
      },
      { title: "Users", description: "Identity and user profiles." },
    ),
    expense: router(
      {
        reports: list(call, "api/v3.0/expense/reports", "List expense reports (v3.0). Filter with user (login ID or ALL), approvalStatusCode, paymentStatusCode, createDateAfter/createDateBefore, modifiedDateAfter/modifiedDateBefore.", {
          user: string().optional(),
          approvalStatusCode: string().optional(),
          paymentStatusCode: string().optional(),
          createDateAfter: string().optional(),
          createDateBefore: string().optional(),
          modifiedDateAfter: string().optional(),
          modifiedDateBefore: string().optional(),
        }),
        report: query(
          { description: "Retrieve one expense report by id.", input: object({ reportId: id, user: string().optional() }) },
          async (_ctx, input) => call("GET", `api/v3.0/expense/reports/${seg(input.reportId)}`, { user: input.user }),
        ),
        reportDigests: list(call, "api/v3.0/expense/reportdigests", "List report digests (summaries for reports ready for processing). Filter with approvalStatusCode, paymentStatusCode, user.", {
          user: string().optional(),
          approvalStatusCode: string().optional(),
          paymentStatusCode: string().optional(),
        }),
        entries: list(call, "api/v3.0/expense/entries", "List expense entries. Filter with reportID, user, createDateAfter/createDateBefore.", {
          reportID: string().optional(),
          user: string().optional(),
          createDateAfter: string().optional(),
          createDateBefore: string().optional(),
        }),
        entry: query(
          { description: "Retrieve one expense entry by id.", input: object({ entryId: id, user: string().optional() }) },
          async (_ctx, input) => call("GET", `api/v3.0/expense/entries/${seg(input.entryId)}`, { user: input.user }),
        ),
        itemizations: list(call, "api/v3.0/expense/itemizations", "List itemizations. Filter with reportID, entryID, user.", {
          reportID: string().optional(),
          entryID: string().optional(),
          user: string().optional(),
        }),
        allocations: list(call, "api/v3.0/expense/allocations", "List allocations. Filter with reportID, entryID, user.", {
          reportID: string().optional(),
          entryID: string().optional(),
          user: string().optional(),
        }),
        attendees: list(call, "api/v3.0/expense/attendees", "List expense attendees.", { user: string().optional() }),
        expenseGroupConfigurations: list(call, "api/v3.0/expense/expensegroupconfigurations", "List expense group configurations (policies, expense types, form fields).", { user: string().optional() }),
        createReport: mutation(
          { description: "Create an expense report (v3.0). body is the Concur report JSON, e.g. { Name, Purpose, PolicyID }.", input: object({ body: record(json()) }) },
          async (_ctx, input) => call("POST", "api/v3.0/expense/reports", {}, input.body),
        ),
        createEntry: mutation(
          { description: "Create an expense entry (v3.0). body is the entry JSON: ReportID, ExpenseTypeCode, TransactionDate, TransactionAmount, TransactionCurrencyCode, etc.", input: object({ body: record(json()) }) },
          async (_ctx, input) => call("POST", "api/v3.0/expense/entries", {}, input.body),
        ),
        updateEntry: mutation(
          { description: "Update an expense entry by id (v3.0). body holds the properties to change.", input: object({ entryId: id, body: record(json()) }) },
          async (_ctx, input) => call("PATCH", `api/v3.0/expense/entries/${seg(input.entryId)}`, {}, input.body),
        ),
        deleteEntry: mutation(
          { description: "Delete an expense entry by id.", input: object({ entryId: id }) },
          async (_ctx, input) => call("DELETE", `api/v3.0/expense/entries/${seg(input.entryId)}`),
        ),
        submitReport: mutation(
          { description: "Submit an expense report for approval by id.", input: object({ reportId: id, body: record(json()).optional() }) },
          async (_ctx, input) => call("POST", `api/expense/expensereport/v1.1/report/${seg(input.reportId)}/submit`, {}, input.body ?? {}),
        ),
      },
      { title: "Expense", description: "Expense reports, entries, itemizations and allocations." },
    ),
    requests: router(
      {
        list: query(
          {
            description: "List travel/expense requests (Request v4) for a user, or all users with the right role. Filter with view (ALL, ACTIVE, PENDINGAPPROVAL...) and userId.",
            input: object({ userId: string().optional(), view: string().optional(), limit: number().optional(), offset: string().optional() }),
          },
          async (_ctx, input: Params) => call("GET", "travelrequest/v4/requests", input),
        ),
        get: query(
          { description: "Retrieve one request by id (Request v4).", input: object({ requestId: id }) },
          async (_ctx, input) => call("GET", `travelrequest/v4/requests/${seg(input.requestId)}`),
        ),
      },
      { title: "Requests", description: "Travel and expense requests (pre-trip approval)." },
    ),
    travel: router(
      {
        trips: query(
          {
            description: "List trips (Itinerary/Trip v1.1). Filter with createdAfterDate, createdBeforeDate, startDate, endDate, lastModified (ISO dates), userid_value and userid_type=login, bookingType.",
            input: object({
              createdAfterDate: string().optional(),
              createdBeforeDate: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
              lastModified: string().optional(),
              userid_type: string().optional(),
              userid_value: string().optional(),
              bookingType: string().optional(),
            }),
          },
          async (_ctx, input: Params) => call("GET", "api/travel/trip/v1.1", input),
        ),
        trip: query(
          { description: "Retrieve one trip by id, with bookings.", input: object({ tripId: id, userid_type: string().optional(), userid_value: string().optional() }) },
          async (_ctx, input) => call("GET", `api/travel/trip/v1.1/${seg(input.tripId)}`, { userid_type: input.userid_type, userid_value: input.userid_value }),
        ),
      },
      { title: "Travel", description: "Trips and bookings." },
    ),
    invoices: router(
      {
        paymentRequests: list(call, "api/v3.0/invoice/paymentrequest", "List invoice payment requests (v3.0). Filter with paymentStatus, createDateAfter/createDateBefore.", {
          paymentStatus: string().optional(),
          createDateAfter: string().optional(),
          createDateBefore: string().optional(),
        }),
        paymentRequest: query(
          { description: "Retrieve one payment request by id.", input: object({ paymentRequestId: id }) },
          async (_ctx, input) => call("GET", `api/v3.0/invoice/paymentrequest/${seg(input.paymentRequestId)}`),
        ),
        purchaseOrders: list(call, "api/v3.0/invoice/purchaseorders", "List purchase orders."),
        vendors: list(call, "api/v3.0/invoice/vendors", "List vendors (v3.0). Filter with vendorCode, name.", {
          vendorCode: string().optional(),
          name: string().optional(),
        }),
        vendor: query(
          { description: "Retrieve one vendor by id.", input: object({ vendorId: id }) },
          async (_ctx, input) => call("GET", `api/v3.0/invoice/vendors/${seg(input.vendorId)}`),
        ),
      },
      { title: "Invoice", description: "Payment requests, purchase orders and vendors." },
    ),
    lists: router(
      {
        lists: list(call, "api/v3.0/common/lists", "List custom lists (v3.0)."),
        listItems: list(call, "api/v3.0/common/listitems", "List items of a custom list. listId is required.", { listId: string() }),
        locations: list(call, "api/v3.0/common/locations", "Search locations. Filter with city, countryCode, name.", {
          city: string().optional(),
          countryCode: string().optional(),
          name: string().optional(),
        }),
      },
      { title: "Lists", description: "Custom lists, list items and locations." },
    ),
    rest: router(
      {
        get: query(
          {
            description: "GET any Concur REST path on your geolocation host, e.g. budget/v4/fiscalYear. path has no leading host. search is an object of query parameters.",
            input: object({ path: id, search: record(string()).optional() }),
          },
          async (_ctx, input) => call("GET", input.path, input.search ?? {}),
        ),
        send: mutation(
          {
            description: "POST, PUT, PATCH or DELETE any Concur REST path with an optional JSON body.",
            input: object({ method: string({ minLength: 3 }), path: id, body: json().optional() }),
          },
          async (_ctx, input) => {
            const method = input.method.toUpperCase();
            if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error("method must be POST, PUT, PATCH or DELETE");
            return call(method as Method, input.path, {}, input.body);
          },
        ),
      },
      { title: "Any endpoint", description: "Generic access to every Concur REST API your app has scopes for." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { sapConcur: sapConcur.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sapConcur ?? [],
        (account) =>
          withApprovals(build(client(account as unknown as AccountFields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SAP Concur",
        description: "Expense reports and entries, requests, trips, invoices, vendors and lists for one SAP Concur company.",
        icons,
        instructions:
          "Use rest.* for any API not wrapped (Expense v4, Budget v4, Cards v4, Request v4 sub-resources). Which calls work depends on the scopes granted to the app. Writes require approval.",
      },
    ),
  }),
);
