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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.nyne.ai";

const nyne = defineProvider({
  name: "Nyne AI",
  hosts: ["api.nyne.ai"],
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  // GET /usage is synchronous, free and authenticated.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/usage`, {
      signal,
      headers: { "X-API-Key": account.fields.apiKey, "X-API-Secret": account.fields.apiSecret },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

const pollDelayMs = 1500;
const maxPolls = 12;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const inProgress = new Set([
  "pending", "queued", "processing", "finding", "fetching", "analyzing", "enriching", "gathering",
  "aggregating", "searching", "discovering", "running", "started", "in_progress",
]);

function client(account: { fields: { apiKey: string; apiSecret: string } }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { "X-API-Key": account.fields.apiKey, "X-API-Secret": account.fields.apiSecret };
  const get = async (path: string, params: Record<string, string>) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return decodeJson(await fetcher(url, { signal, headers }), json());
  };
  const post = async (path: string, body: Record<string, unknown>) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );
  const status = (path: string, requestId: string, extra: Record<string, string> = {}) =>
    get(path, { ...extra, request_id: requestId });
  // Submit, then poll the same path for a short while. A job still running afterwards is returned with its
  // request_id so the caller can continue with getResult.
  const submit = async (path: string, body: Record<string, unknown>) => {
    const accepted = (await post(path, body)) as { data?: { request_id?: string } };
    const requestId = accepted.data?.request_id;
    if (typeof requestId !== "string") return accepted;
    let latest: unknown = accepted;
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      await sleep(pollDelayMs);
      latest = await status(path, requestId);
      const data = (latest as { data?: { status?: string; completed?: boolean } }).data;
      if (data?.completed === true || (typeof data?.status === "string" && !inProgress.has(data.status))) return latest;
    }
    return { pending: true, requestId, path, note: "Still running. Call getResult with this path and requestId later.", latest };
  };
  return { get, post, status, submit };
}

type Api = ReturnType<typeof client>;

const bodyInput = object({ body: record(json()) });

const personEndpoints: Array<[string, string, string]> = [
  ["search", "/person/search", "Find people by natural-language query with structured filters (company, title, location). Supports cursor pagination."],
  ["enrichment", "/person/enrichment", "Resolve a full person profile from an email, phone, social profile URL or name (plus optional company and city)."],
  ["deepResearch", "/person/deep-research", "Run an in-depth autonomous research pass on a person."],
  ["osint", "/person/osint", "Agentic OSINT investigation on a person. Disabled by default; access is by request."],
  ["interests", "/person/interests", "Infer a person's interests and affinities."],
  ["articleSearch", "/person/articlesearch", "Find articles and press mentions for a person."],
  ["newsfeed", "/person/newsfeed", "Pull recent social posts from a person's resolved profiles."],
  ["interactions", "/person/interactions", "Surface a person's social interactions and engagement."],
  ["competitorEngagements", "/person/competitor-engagements", "Detect a person's engagement with competitor content."],
  ["events", "/person/events", "Retrieve notable career and life events for a person."],
  ["ask", "/person/ask", "Ask a natural-language question about a person."],
  ["leads", "/person/leads", "Generate qualified lead candidates from a natural-language description."],
  ["discover", "/person/discover", "Discover matching people from keywords and a location."],
  ["discovery", "/person/discovery", "Discover people from the open web with natural-language queries and match conditions."],
  ["simulation", "/person/simulation", "Predict how a person would respond to a question."],
  ["lookupFields", "/person/lookup-fields", "Request only specific fields for a person from any identifier."],
  ["email", "/person/email", "Find a verified business email for a person."],
  ["phone", "/person/phone", "Find a phone number for a person."],
  ["socialLookup", "/person/social-lookup", "Resolve a profile on a target platform from another identifier."],
  ["singleSocialLookup", "/person/single-social-lookup", "Resolve a single social profile (alias of social lookup)."],
  ["socialAccountValidator", "/person/social-account-validator", "Validate a public social profile or post and capture a screenshot."],
  ["socialProfiles", "/person/social-profiles", "Find all social media accounts for a person."],
];

const companyEndpoints: Array<[string, string, string]> = [
  ["search", "/company/search", "Find companies from a natural-language query."],
  ["discovery", "/company/discovery", "Discover companies from the open web with natural-language queries and match conditions."],
  ["enrichment", "/company/enrichment", "Resolve a full company profile from a domain, email, phone or company social URL."],
  ["employees", "/company/employees", "Retrieve public employee profiles for a company."],
  ["intent", "/company/intent", "Find and rank ICP candidates from demonstrated buying-intent signals."],
  ["checkSeller", "/company/checkseller", "Verify whether a company sells a given product or service."],
  ["checkFeature", "/company/checkfeature", "Detect whether a company's site has a given feature, technology or capability."],
  ["funding", "/company/funding", "Retrieve verified funding-round and acquisition history for a company."],
  ["funders", "/company/funders", "Look up an investor or fund profile (partners, thesis, check size, recent deals)."],
  ["needs", "/company/needs", "Summarize pain points and challenges from a company's official filings."],
  ["competitorEngagements", "/company/competitor-engagements", "Find people who engaged with a company page, with profile URLs and post context."],
];

function group(entries: Array<[string, string, string]>, api: Api) {
  const make = (path: string, description: string) =>
    mutation(
      {
        description: `${description} Spends Nyne credits. Pass the request parameters in body (see https://api.nyne.ai/documentation${path}.md). Waits up to about 18 seconds for the async job; if it is still running the reply has pending: true and a requestId to pass to getResult.`,
        input: bodyInput,
      },
      async (_ctx, { body }) => api.submit(path, body),
    );
  const tools: Record<string, ReturnType<typeof make>> = {};
  for (const [name, path, description] of entries) tools[name] = make(path, description);
  return tools;
}

function build(api: Api) {
  return router({
    usage: query(
      {
        description: "Get credit consumption, allocation, remaining balance and per-API usage for the active billing period, or for a given month and year (supply both). Free.",
        input: object({ month: number().optional(), year: number().optional() }),
      },
      async (_ctx, { month, year }) =>
        api.get("/usage", {
          ...(month === undefined ? {} : { month: String(month) }),
          ...(year === undefined ? {} : { year: String(year) }),
        }),
    ),
    getResult: query(
      {
        description: "Fetch the status or result of an earlier async request. path is the endpoint path it was submitted to (for example /person/enrichment) and requestId is the request_id it returned. Free.",
        input: object({ path: string({ minLength: 1 }), requestId: string({ minLength: 1 }) }),
      },
      async (_ctx, { path, requestId }) => {
        if (!/^\/(person|company)\/[a-z-]+$/.test(path)) throw new Error("path must look like /person/enrichment or /company/search");
        return api.status(path, requestId);
      },
    ),
    person: router(group(personEndpoints, api), {
      title: "Person",
      description: "Person search, enrichment, contact finding, social intelligence and AI research.",
    }),
    company: router(group(companyEndpoints, api), {
      title: "Company",
      description: "Company search, enrichment, employees, funding, intent and technographics.",
    }),
  });
}

export default defineApp(
  { user: { accounts: { nyne: nyne.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nyne ?? [],
        (account) =>
          withApprovals(build(client(account, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nyne AI",
        description: "People and company data from Nyne.ai: person and company search, enrichment, email and phone finding, social intelligence and AI research.",
        icons,
        instructions:
          "Data endpoints are asynchronous and cost credits; each tool submits the job and polls briefly. If a reply has pending: true, call getResult with its path and requestId. Check usage for the credit balance.",
      },
    ),
  }),
);
