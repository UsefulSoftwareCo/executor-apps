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
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Fields = { environment: string; companyId: string; clientId: string; clientSecret: string };

// Paylocity NextGen runs on two gateways: production and the demo (sandbox) gateway. Credentials only go to these.
const origins: Record<string, string> = {
  production: "https://dc1prodgwext.paylocity.com",
  demo: "https://dc1demogwext.paylocity.com",
};

function originOf(environment: string): string {
  const origin = origins[environment.trim().toLowerCase()];
  if (origin === undefined) throw new Error('Environment must be "production" or "demo".');
  return origin;
}

async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${originOf(fields.environment)}/public/security/v1/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

const paylocity = defineProvider({
  name: "Paylocity (NextGen)",
  hosts: ["dc1prodgwext.paylocity.com", "dc1demogwext.paylocity.com"],
  auth: {
    // Paylocity issues the client id and secret after approving an integration request; there is no self-service OAuth app.
    clientCredentials: secrets({
      label: "Paylocity-issued client credentials",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        companyId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting a token proves the client id, secret and environment. No read endpoint is safe to assume for every grant.
  async health({ account, fetch, signal }) {
    await accessToken(account.fields, fetch, signal);
    return {
      accountInfo: {
        externalId: `${account.fields.environment.trim().toLowerCase()}:${account.fields.companyId}`,
        displayName: `${account.fields.companyId} (${account.fields.environment.trim().toLowerCase()})`,
      },
    };
  },
});

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const origin = originOf(fields.environment);
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  const call = async (method: "GET" | "POST", path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return { call, defaultCompany: fields.companyId };
}

type Client = ReturnType<typeof client>;

const company = string().optional();
const listing = {
  limit: number().optional(),
  offset: number().optional(),
  includeTotalCount: boolean().optional(),
};

// Paths use {companyId} (defaulting to the account's company) and named ids; every other input is a query parameter.
function read(
  c: Client,
  path: string,
  description: string,
  ids: readonly string[] = [],
  extra: Record<string, any> = {},
) {
  return query(
    {
      description,
      input: object({
        companyId: company,
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        ...extra,
      }),
    },
    async (_ctx, input: Params) => run(c, "GET", path, input, ids),
  );
}

function write(c: Client, path: string, description: string, body: any) {
  return mutation(
    { description, input: object({ companyId: company, body }) },
    async (_ctx, input: Params) => run(c, "POST", path, input, [], input.body as Params),
  );
}

async function run(c: Client, method: "GET" | "POST", path: string, input: Params, ids: readonly string[], body?: Params) {
  let resolved = path.replace("{companyId}", encodeURIComponent(String(input.companyId ?? c.defaultCompany)));
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  const used = new Set(["companyId", "body", ...ids]);
  const search = Object.fromEntries(Object.entries(input).filter(([key]) => !used.has(key)));
  return c.call(method, resolved, search, body);
}

const filterDoc = "filter is a Paylocity filter expression (operators eq, in, lt, gt, le, ge, and, or).";
const filterQuery = { filter: string().optional() };
const fieldsQuery = { fields: string().optional() };
const sortQuery = { sort: string().optional() };

function build(c: Client) {
  const co = "/apiHub";
  return router({
    employees: router(
      {
        list: read(c, `${co}/coreHR/v2/companies/{companyId}/employees`, `List employees (Employee Demographics v2, early-adoption customers only). ${filterDoc} fields selects response fields.`, [], { ...listing, ...filterQuery, ...fieldsQuery }),
        get: read(c, `${co}/coreHR/v2/companies/{companyId}/employees/{employeeId}`, "Get one employee (Employee Demographics v2, early-adoption customers only).", ["employeeId"], fieldsQuery),
      },
      { title: "Employees" },
    ),
    payroll: router(
      {
        payStatements: router({
          list: read(c, `${co}/payroll/v1/companies/{companyId}/employees/{employeeId}/payStatements`, `List an employee's pay statements. rangeStart and rangeEnd bound the check dates. ${filterDoc}`, ["employeeId"], { rangeStart: string().optional(), rangeEnd: string().optional(), agencyCheckProcessId: string().optional(), ...listing, ...fieldsQuery, ...filterQuery }),
          get: read(c, `${co}/payroll/v1/companies/{companyId}/employees/{employeeId}/payStatements/{payStatementId}`, "Get one pay statement.", ["employeeId", "payStatementId"], fieldsQuery),
        }),
        bankAccounts: router({
          list: read(c, `${co}/payroll/v1/companies/{companyId}/employees/{employeeId}/bankAccounts`, "List an employee's direct deposit bank accounts.", ["employeeId"]),
          get: read(c, `${co}/payroll/v1/companies/{companyId}/employees/{employeeId}/bankAccounts/{bankAccountId}`, "Get one direct deposit bank account.", ["employeeId", "bankAccountId"]),
        }),
        earnings: router({
          get: read(c, `${co}/payroll/v1/companies/{companyId}/employees/{employeeId}/earnings/{earningCode}/{resourceId}`, "Get an employee earning by earning code and resource id.", ["employeeId", "earningCode", "resourceId"]),
        }),
        payEntryImport: router({
          create: write(c, `${co}/payroll/v2/companies/{companyId}/payEntryImport`, "Submit a new payroll batch (Run Payroll pay entry). body: { batchName, payPeriodBeginDate, payPeriodEndDate, checkDate, checkType, autoAcknowledge, mergeBatchId, payEntries: [{ employeeId, det, detCode, hours, amount, tempRate, rateCode, costCenter1..3, jobCode, shift, beginDate, endDate, workersCompCode, sequence, checkType, checkNumber }] }.", record(json())),
          status: read(c, `${co}/payroll/v2/companies/{companyId}/payEntryImport/{timeImportFileTrackingId}`, "Get the status and details of a submitted payroll batch.", ["timeImportFileTrackingId"]),
        }),
      },
      { title: "Payroll" },
    ),
    time: router(
      {
        costCenters: router({
          list: read(c, `${co}/time/v1/companies/{companyId}/costCenters`, "List Time and Labor cost centers (labor levels).", [], listing),
        }),
        punchDetails: router({
          forEmployee: read(c, `${co}/time/v2/companies/{companyId}/employees/{employeeId}/punchDetails`, "Get an employee's punch details between relativeStart and relativeEnd (ISO date-times).", ["employeeId"], { relativeStart: string(), relativeEnd: string(), testFlag: boolean().optional() }),
          createOperation: write(c, `${co}/time/v2/companies/{companyId}/punchDetails`, "Step 1 of the company punch detail export: start an operation. body: { relativeStart, relativeEnd } (ISO date-times). Then poll getOperation and read the data with getData.", record(json())),
          getOperation: read(c, `${co}/time/v2/companies/{companyId}/punchDetailOperations/{operationId}`, "Step 2: check the status of a punch detail operation; it returns the resource id once complete.", ["operationId"], { testFlag: boolean().optional() }),
          getData: read(c, `${co}/time/v2/companies/{companyId}/punchDetails/{resourceId}`, "Step 3: read the punch detail data for a completed operation's resource id.", ["resourceId"], { ...listing, ...sortQuery, testFlag: boolean().optional() }),
        }),
      },
      { title: "Time and Labor" },
    ),
    scheduling: router(
      {
        shifts: read(c, `${co}/scheduling/v1/companies/{companyId}/shifts`, `List company shifts. include accepts breaks, draft, segments, note. ${filterDoc} Filter fields: startDateTime, positionKey.`, [], { include: string().optional(), ...listing, ...filterQuery, ...sortQuery }),
        employeeShifts: read(c, `${co}/scheduling/v1/companies/{companyId}/employees/{employeeId}/shifts`, "List one employee's shifts.", ["employeeId"], { include: string().optional(), ...listing, ...filterQuery, ...sortQuery }),
        openShifts: read(c, `${co}/scheduling/v1/companies/{companyId}/openShifts`, "List open shifts not assigned to an employee.", [], { include: string().optional(), ...listing, ...filterQuery, ...sortQuery }),
      },
      { title: "Scheduling" },
    ),
  });
}

export default defineApp(
  { user: { accounts: { paylocity: paylocity.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.paylocity ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Paylocity (NextGen)",
        description:
          "Paylocity NextGen API: employees, pay statements, bank accounts, earnings, pay entry imports, cost centers, punch details and shifts.",
        instructions:
          "Every tool defaults companyId to the account's company. List endpoints take limit, offset and includeTotalCount. Several endpoints are restricted to approved customers or early-adoption partners and answer 403 otherwise.",
        icons,
      },
    ),
  }),
);
