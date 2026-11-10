import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  oauth2,
  query,
  router,
  string,
} from "apps";
import { icons } from "./icon.js";

const origin = "https://api.paychex.com";

type Account = { fields: { access_token: string } };

const paychex = defineProvider({
  name: "Paychex",
  hosts: ["api.paychex.com"],
  auth: {
    // An API application exchanges its client id and secret for a one-hour bearer token.
    apiApp: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origin}/auth/oauth/v2/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/companies`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/vnd.paychex.companies.v1+json" },
    });
    // Only the presence of the content envelope is checked.
    await decodeJson(response, object({ content: json() }));
    return { accountInfo: { displayName: "Paychex API application" } };
  },
});

const workerMedia = [
  "application/vnd.paychex.workers.v1+json: full profile including PII",
  "application/vnd.paychex.workers_communications.v1+json: full profile with PII plus communications",
  "application/vnd.paychex.workers.nonpii.v1+json: profile without PII",
  "application/vnd.paychex.workers.nonpii_communications.v1+json: profile without PII plus communications",
  "application/vnd.paychex.workers.roster.v1+json: lightweight roster",
].join("; ");

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const get = async (path: string, accept: string, params: Record<string, unknown> = {}) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null) search.set(key, String(value));
    const url = `${origin}${path}${search.size > 0 ? `?${search.toString()}` : ""}`;
    const response = await fetcher(url, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: accept },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Paychex answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const id = (value: string) => encodeURIComponent(value);

  return router({
    companies: router({
      list: query(
        {
          description: "List the companies (clients) this API application is authorized to access. Each company has a companyId used by the other tools.",
          input: object({}),
        },
        async () => get("/companies", "application/vnd.paychex.companies.v1+json"),
      ),
      get: query(
        {
          description: "Retrieve one company by companyId (from companies.list).",
          input: object({ companyId: string() }),
        },
        async (_ctx, input) => get(`/companies/${id(input.companyId)}`, "application/json"),
      ),
    }),
    workers: router({
      listForCompany: query(
        {
          description: `List the workers of a company. Pages with offset (default 0) and limit. accept selects the representation: ${workerMedia}. Defaults to application/json.`,
          input: object({
            companyId: string(),
            offset: number().optional(),
            limit: number().optional(),
            accept: string().optional(),
          }),
        },
        async (_ctx, input) =>
          get(`/companies/${id(input.companyId)}/workers`, input.accept ?? "application/json", {
            offset: input.offset,
            limit: input.limit,
          }),
      ),
      list: query(
        {
          description: "List workers across companies, optionally filtered by companyid. Pages with offset and limit.",
          input: object({ companyid: string().optional(), offset: number().optional(), limit: number().optional() }),
        },
        async (_ctx, input) =>
          get("/workers", "application/json", { companyid: input.companyid, offset: input.offset, limit: input.limit }),
      ),
      get: query(
        {
          description: "Retrieve one worker (an EMPLOYEE or INDEPENDENT_CONTRACTOR) by workerId.",
          input: object({ workerId: string() }),
        },
        async (_ctx, input) => get(`/workers/${id(input.workerId)}`, "application/vnd.paychex.worker.v1+json"),
      ),
      listCommunications: query(
        {
          description: "List a worker's communication details (phone, email and the like).",
          input: object({ workerId: string() }),
        },
        async (_ctx, input) => get(`/workers/${id(input.workerId)}/communications`, "application/json"),
      ),
      getCommunication: query(
        {
          description: "Retrieve one communication record of a worker.",
          input: object({ workerId: string(), communicationId: string() }),
        },
        async (_ctx, input) =>
          get(`/workers/${id(input.workerId)}/communications/${id(input.communicationId)}`, "application/json"),
      ),
    }),
    request: query(
      {
        description:
          "Read-only GET against any other Paychex API path the application is entitled to (for example a link returned in a response's links array). path must start with / and is relative to https://api.paychex.com. accept defaults to application/json; some APIs require a vendor media type.",
        input: object({ path: string({ minLength: 1 }), accept: string().optional(), query: json().optional() }),
      },
      async (_ctx, input) => {
        if (!input.path.startsWith("/") || input.path.startsWith("//") || input.path.includes("://"))
          throw new Error("path must start with a single / and be relative to https://api.paychex.com.");
        const params = typeof input.query === "object" && input.query !== null ? (input.query as Record<string, unknown>) : {};
        return get(input.path, input.accept ?? "application/json", params);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { paychex: paychex.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.paychex ?? [], (account) => build(account as unknown as Account, fetch, signal), { signal }),
      {
        title: "Paychex",
        description: "Paychex Flex payroll and HR data: companies, workers and worker communications, plus read-only access to other Paychex API paths.",
        instructions:
          "Start with companies.list to get a companyId, then workers.listForCompany. Lists page with offset and limit. All tools are read-only.",
        icons,
      },
    ),
  }),
);
