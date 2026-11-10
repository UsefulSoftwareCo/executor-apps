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
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// SuccessFactors tenants live on a data-center API server such as api10.successfactors.com
// (also *.successfactors.eu, *.sapsf.com, *.sapsf.cn, *.sapsf.eu, *.successfactors.cn).
const hostPattern = /^[a-z0-9][a-z0-9.-]*\.(successfactors\.(com|eu|cn)|sapsf\.(com|cn|eu))$/;

function apiServer(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter the SuccessFactors API server for your data center, for example api10.successfactors.com.");
  return host;
}

const server = plain(string({ minLength: 1 }));

const sapSuccessFactors = defineProvider({
  name: "SAP SuccessFactors",
  hosts: ["*.successfactors.com", "*.successfactors.eu", "*.successfactors.cn", "*.sapsf.com", "*.sapsf.cn", "*.sapsf.eu"],
  auth: {
    basic: secrets({
      label: "API user (basic authentication)",
      fields: object({
        apiServer: server,
        companyId: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
    accessToken: secrets({
      label: "OAuth access token",
      fields: object({ apiServer: server, accessToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = apiServer(account.fields.apiServer);
    const response = await fetch(`https://${host}/odata/v2/User?$top=1&$select=userId&$format=json`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: {
        externalId: account.method === "basic" ? `${host}/${account.fields.companyId}` : host,
        displayName: account.method === "basic" ? account.fields.companyId : host,
      },
    };
  },
});

type AccountFields =
  | { method: "basic"; fields: { apiServer: string; companyId: string; username: string; password: string } }
  | { method: "accessToken"; fields: { apiServer: string; accessToken: string } };

function base64Utf8(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function authorization(account: { method: string; fields: unknown }): string {
  const a = account as AccountFields;
  return a.method === "basic"
    ? `Basic ${base64Utf8(`${a.fields.username}@${a.fields.companyId}:${a.fields.password}`)}`
    : `Bearer ${a.fields.accessToken}`;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "MERGE";
type Params = Record<string, unknown>;

function client(account: AccountFields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const host = apiServer(account.fields.apiServer);
  const base = `https://${host}/odata/v2`;
  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const pairs = [["$format", "json"], ...Object.entries(search).filter(([, v]) => v !== undefined && v !== null)];
    // encodeURIComponent writes spaces as %20; URLSearchParams would write "+", which OData reads as the add operator.
    const query = pairs.map(([key, value]) => `${encodeURIComponent(key).replace(/%24/g, "$")}=${encodeURIComponent(String(value))}`).join("&");
    const url = `${base}/${path.replace(/^\/+/, "")}?${query}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: {
        Authorization: authorization(account),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Successful OData writes (PUT, MERGE, DELETE) commonly answer 204 with no body.
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return {};
    return decodeJson(response, json());
  };
  const metadata = async (path: string) => {
    const response = await fetcher(`${base}/${path}`, { signal, headers: { Authorization: authorization(account) } });
    if (!response.ok) throw new Error(`SuccessFactors returned ${response.status} for ${path}`);
    return { xml: await response.text() };
  };
  return { call, metadata };
}

type Client = ReturnType<typeof client>;

const odataOptions = {
  filter: string().optional(),
  select: string().optional(),
  expand: string().optional(),
  orderby: string().optional(),
  top: number().optional(),
  skip: number().optional(),
};
const optionsDoc =
  "Options are OData v2: filter (e.g. \"status eq 'active'\"), select, expand, orderby, top (page size, max 1000) and skip. Results carry d.__next when more pages exist.";

function toSearch(input: Params): Params {
  const out: Params = {};
  for (const key of ["filter", "select", "expand", "orderby", "top", "skip"]) {
    if (input[key] !== undefined) out[`$${key}`] = input[key];
  }
  return out;
}

function list(c: Client, entity: string, description: string) {
  return query(
    { description: `${description} ${optionsDoc}`, input: object(odataOptions) },
    async (_ctx, input: Params) => c.call("GET", entity, toSearch(input)),
  );
}

function get(c: Client, entity: string, description: string, keyDoc: string) {
  return query(
    {
      description,
      input: object({ key: string({ minLength: 1 }), select: string().optional(), expand: string().optional() }),
    },
    async (_ctx, input) => c.call("GET", `${entity}(${keyDoc === "string" ? `'${input.key.replace(/'/g, "''")}'` : input.key})`, toSearch(input)),
  );
}

const entity = string({ minLength: 1 });

function build(c: Client) {
  const entityPath = (name: string, key?: string) => (key === undefined ? name : `${name}(${key})`);
  return router({
    employees: router(
      {
        users: list(c, "User", "List users (userId, username, name, email, department, manager, status)."),
        user: get(c, "User", "Retrieve a user by userId.", "string"),
        personalInfo: list(c, "PerPersonal", "List personal information records (names, gender, etc.)."),
        persons: list(c, "PerPerson", "List persons (use expand for personalInfoNav, emailNav, phoneNav)."),
        employments: list(c, "EmpEmployment", "List employment records (hire date, start date, user)."),
        jobs: list(c, "EmpJob", "List job information records (position, department, manager, job code, event reason)."),
        compensation: list(c, "EmpCompensation", "List employee compensation records."),
        recurringPay: list(c, "EmpPayCompRecurring", "List recurring pay component records."),
        terminations: list(c, "EmpEmploymentTermination", "List employment terminations."),
      },
      { title: "Employee Central", description: "People, employment, job and compensation data." },
    ),
    organization: router(
      {
        companies: list(c, "FOCompany", "List legal entities (companies)."),
        businessUnits: list(c, "FOBusinessUnit", "List business units."),
        divisions: list(c, "FODivision", "List divisions."),
        departments: list(c, "FODepartment", "List departments."),
        costCenters: list(c, "FOCostCenter", "List cost centers."),
        locations: list(c, "FOLocation", "List locations."),
        jobCodes: list(c, "FOJobCode", "List job classifications."),
        positions: list(c, "Position", "List positions (use expand for incumbents)."),
      },
      { title: "Organization", description: "Foundation objects and positions." },
    ),
    recruiting: router(
      {
        requisitions: list(c, "JobRequisition", "List job requisitions."),
        applications: list(c, "JobApplication", "List job applications."),
        candidates: list(c, "Candidate", "List candidates."),
        interviews: list(c, "ApplicationInterview", "List application interviews."),
        talentPools: list(c, "TalentPool", "List talent pools."),
      },
      { title: "Recruiting", description: "Requisitions, candidates, applications and interviews." },
    ),
    entities: router(
      {
        list: query(
          {
            description: `List any OData v2 entity set of your tenant, for example Goal_1, cust_MyObject or TimeOff. ${optionsDoc}`,
            input: object({ entity, ...odataOptions }),
          },
          async (_ctx, input) => c.call("GET", input.entity, toSearch(input)),
        ),
        get: query(
          {
            description:
              "Retrieve one entity by key. key is the OData key expression without parentheses, e.g. 'admin' (with quotes) for User or userId='admin',startDate=datetime'2024-01-01T00:00:00' for EmpJob.",
            input: object({ entity, key: string({ minLength: 1 }), select: string().optional(), expand: string().optional() }),
          },
          async (_ctx, input) => c.call("GET", entityPath(input.entity, input.key), toSearch(input)),
        ),
        metadata: query(
          {
            description: "Fetch the OData $metadata (EDMX XML, returned as { xml }) listing all entities and properties of the tenant, or of one entity set.",
            input: object({ entity: string().optional() }),
          },
          async (_ctx, input) => c.metadata(input.entity === undefined ? "$metadata" : `${input.entity}/$metadata`),
        ),
        upsert: mutation(
          {
            description:
              "Create or update records with the SuccessFactors upsert function import. body is one entity object or an array, each with __metadata { uri, type } as described in the SAP OData API reference.",
            input: object({ body: json() }),
          },
          async (_ctx, input) => c.call("POST", "upsert", {}, input.body),
        ),
        create: mutation(
          {
            description: "Create one record in an entity set. body is the JSON entity.",
            input: object({ entity, body: record(json()) }),
          },
          async (_ctx, input) => c.call("POST", input.entity, {}, input.body),
        ),
        update: mutation(
          {
            description: "Update one record (MERGE semantics: only the supplied properties change). key as in entities.get.",
            input: object({ entity, key: string({ minLength: 1 }), body: record(json()) }),
          },
          async (_ctx, input) => c.call("MERGE", entityPath(input.entity, input.key), {}, input.body),
        ),
        delete: mutation(
          {
            description: "Delete one record by key. key as in entities.get.",
            input: object({ entity, key: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("DELETE", entityPath(input.entity, input.key)),
        ),
      },
      { title: "Any entity", description: "Generic OData v2 access to every entity set your API user can reach." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { sapSuccessFactors: sapSuccessFactors.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sapSuccessFactors ?? [],
        (account) =>
          withApprovals(build(client(account as unknown as AccountFields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SAP SuccessFactors",
        description: "Employee Central, organization, recruiting and any OData v2 entity of one SuccessFactors tenant.",
        icons,
        instructions:
          "Named tools cover common entities; entities.* reaches any entity set (custom MDF objects are cust_*). Use entities.metadata to discover properties. Page with top/skip. Writes require approval.",
      },
    ),
  }),
);
