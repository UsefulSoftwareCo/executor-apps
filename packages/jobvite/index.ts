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

const base = "https://api.jobvite.com/api/v2";

const jobvite = defineProvider({
  name: "Jobvite",
  hosts: ["api.jobvite.com"],
  auth: {
    // Jobvite issues an API key and a secret key pair; both are sent as headers.
    apiKey: secrets({
      label: "API key and secret key",
      fields: object({ apiKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/candidate?count=1`, { signal, headers: authHeaders(account.fields) });
    await decodeJson(response, json());
  },
});

function authHeaders(fields: { apiKey: string; secretKey: string }) {
  return { "x-jvi-api": fields.apiKey, "x-jvi-sc": fields.secretKey, "content-type": "application/json" };
}

type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>;

const search = record(json()).optional();

function rest(fields: { apiKey: string; secretKey: string }, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, params, body) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: authHeaders(fields),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const list = (description: string, path: string) =>
    query({ description: `${description} Pass filters and paging (for example start, count, updatedSince) as query.`, input: object({ query: search }) }, (_ctx, args) =>
      call("GET", path, (args.query as Params | undefined) ?? {}, undefined),
    );
  const byApplication = (description: string, suffix: string) =>
    query({ description, input: object({ applicationId: string() }) }, (_ctx, args) =>
      call("GET", `/application/${encodeURIComponent(args.applicationId)}/${suffix}`, {}, undefined),
    );

  return router({
    candidate: router({
      list: list(
        "List candidates and their applications. Filter with query parameters such as updatedSince, jobId, stage or workflowState.",
        "/candidate",
      ),
      get: query({ description: "Get the attachments of one candidate (endpoint unconfirmed against official docs).", input: object({ candidateId: string() }) }, (_ctx, args) =>
        call("GET", `/candidate/${encodeURIComponent(args.candidateId)}`, {}, undefined),
      ),
      update: mutation(
        {
          description:
            "Update candidate or application details (request shape unconfirmed against official docs), add attachments, or change an application stage. Pass the JSON request body as body.",
          input: object({ body: record(json()) }),
        },
        (_ctx, args) => call("PUT", "/candidate", {}, args.body as Params),
      ),
    }),
    application: router({
      education: byApplication("Get the education history of an application's candidate.", "education"),
      workHistory: byApplication("Get the work history of an application's candidate.", "workhistory"),
    }),
    job: router({ list: list("List jobs (requisitions).", "/job") }),
    employee: router({ list: list("List Jobvite users.", "/employee") }),
    department: router({ list: list("List departments.", "/department") }),
    disposition: router({ list: list("List rejection reasons (dispositions).", "/disposition") }),
    offerLetter: router({
      get: query({ description: "Get the offer letter of an application (endpoint unconfirmed against official docs). Pass the application id and other filters as query.", input: object({ query: search }) }, (_ctx, args) =>
        call("GET", "/offerLetter", (args.query as Params | undefined) ?? {}, undefined),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { jobvite: jobvite.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jobvite ?? [],
        (account) => withApprovals(rest(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Jobvite",
        description: "Jobvite applicant tracking: candidates, applications, jobs, employees, departments, rejection reasons and offer letters.",
        icons,
      },
    ),
  }),
);
