import {
  accountRouter,
  array,
  boolean,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://api.usebouncer.com";

const bouncer = defineProvider({
  name: "Bouncer",
  hosts: ["api.usebouncer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Checking credits is free and is the documented way to confirm a key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${BASE}/v1.1/credits`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ credits: number() }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  const headers = { "x-api-key": token };
  const send = async (method: string, path: string, params?: Params, body?: unknown) =>
    decodeJson(
      await fetcher(url(path, params), {
        method,
        signal,
        headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );
  return {
    get: (path: string, params?: Params) => send("GET", path, params),
    post: (path: string, params?: Params, body?: unknown) => send("POST", path, params, body),
    del: (path: string) => send("DELETE", path),
  };
}

type Client = ReturnType<typeof client>;
const id = () => string({ minLength: 1 });

const tools = (c: Client) =>
  router({
    credits: query(
      { description: "Check the number of verification credits left on the account.", input: object({}) },
      async () => c.get("/v1.1/credits"),
    ),
    verifyEmail: query(
      {
        description:
          "Verify one email address in real time (spends a credit). Returns status (deliverable, risky, undeliverable, unknown), reason, and domain and account details. timeout is seconds, default 10.",
        input: object({ email: string({ minLength: 1 }), timeout: number().optional() }),
      },
      async (_ctx, { email, timeout }) => c.get("/v1.1/email/verify", { email, timeout }),
    ),
    verifyDomain: query(
      {
        description: "Check a domain: MX records and whether it is a catch-all (accept-all) domain.",
        input: object({ domain: string({ minLength: 1 }) }),
      },
      async (_ctx, { domain }) => c.get("/v1.1/domain", { domain }),
    ),
    verifyEmailsSync: mutation(
      {
        description:
          "Verify a list of emails with the synchronous batch endpoint and get results in the response (spends credits per email).",
        input: object({ emails: array(string({ minLength: 1 })) }),
        approval: always(),
      },
      async (_ctx, { emails }) => c.post("/v1.1/email/verify/batch/sync", undefined, emails),
    ),
    batch: router({
      create: mutation(
        {
          description:
            "Create an asynchronous batch verification of up to 100,000 emails (sent as {email} objects, matching the vendor example). Returns a batchId; poll batch status, then fetch results. callback is an optional URL Bouncer calls when finished.",
          input: object({ emails: array(string({ minLength: 1 })), callback: string().optional() }),
          approval: always(),
        },
        async (_ctx, { emails, callback }) =>
          c.post("/v1.1/email/verify/batch", { callback }, emails.map((email) => ({ email }))),
      ),
      status: query(
        {
          description: "Get the status of a batch. withStats adds progress and per-status counts.",
          input: object({ batchId: id(), withStats: boolean().optional() }),
        },
        async (_ctx, { batchId, withStats }) =>
          c.get(`/v1.1/email/verify/batch/${encodeURIComponent(batchId)}`, { "with-stats": withStats === undefined ? undefined : String(withStats) }),
      ),
      results: query(
        {
          description:
            "Download results of a completed batch as JSON. download must be exactly one of: all, deliverable, risky, undeliverable, unknown (default all); other values are rejected by Bouncer.",
          input: object({ batchId: id(), download: string().optional() }),
        },
        async (_ctx, { batchId, download }) =>
          c.get(`/v1.1/email/verify/batch/${encodeURIComponent(batchId)}/download`, { download }),
      ),
      finish: mutation(
        {
          description:
            "Finish a batch early: stops processing and returns credits for emails not yet verified. Results can be downloaded once status is completed.",
          input: object({ batchId: id() }),
          approval: always(),
        },
        async (_ctx, { batchId }) => c.post(`/v1.1/email/verify/batch/${encodeURIComponent(batchId)}/finish`),
      ),
      delete: mutation(
        {
          description: "Delete a batch and its emails. Results are lost.",
          input: object({ batchId: id() }),
          approval: always(),
        },
        async (_ctx, { batchId }) => c.del(`/v1.1/email/verify/batch/${encodeURIComponent(batchId)}`),
      ),
    }),
    toxicity: router({
      create: mutation(
        {
          description: "Create a toxicity list job for a list of emails (flags spam traps, complainers and abusers). Returns a job id.",
          input: object({ emails: array(string({ minLength: 1 })) }),
          approval: always(),
        },
        async (_ctx, { emails }) => c.post("/v1/toxicity/list", undefined, emails),
      ),
      status: query(
        {
          description: "Get the status of a toxicity list job.",
          input: object({ id: id() }),
        },
        async (_ctx, input) => c.get(`/v1/toxicity/list/${encodeURIComponent(input.id)}`),
      ),
      results: query(
        {
          description: "Download the results of a completed toxicity list job.",
          input: object({ id: id() }),
        },
        async (_ctx, input) => c.get(`/v1/toxicity/list/${encodeURIComponent(input.id)}/data`),
      ),
      delete: mutation(
        {
          description: "Delete a toxicity list job.",
          input: object({ id: id() }),
          approval: always(),
        },
        async (_ctx, input) => c.del(`/v1/toxicity/list/${encodeURIComponent(input.id)}`),
      ),
    }),
  });

export default defineApp(
  { user: { accounts: { bouncer: bouncer.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.bouncer ?? [], (account) => tools(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Bouncer",
        description:
          "Bouncer email verification: real-time and batch email verification, domain checks, toxicity lists and credit balance.",
        icons,
      },
    ),
  }),
);
