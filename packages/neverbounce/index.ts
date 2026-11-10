import {
  accountRouter,
  array,
  boolean,
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

const base = "https://api.neverbounce.com/v4.2";

const neverbounce = defineProvider({
  name: "NeverBounce",
  hosts: ["api.neverbounce.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // NeverBounce answers 200 with status "auth_failure" for a bad key, so check the status field.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/info`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ key: account.fields.token }),
    });
    const body = (await response.json()) as { status?: string; message?: string };
    if (!response.ok || body.status !== "success") {
      throw new Error(`NeverBounce rejected the API key: ${body.message ?? body.status ?? response.status}`);
    }
  },
});

type Account = { fields: { token: string } };

const call = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, unknown>,
) => {
  const body: Record<string, unknown> = { key: account.fields.token };
  for (const [name, value] of Object.entries(params)) if (value !== undefined) body[name] = value;
  const response = await fetch(`${base}/${path}`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`NeverBounce ${path} failed with HTTP ${response.status}`);
  const result = (await response.json()) as { status?: string; message?: string };
  if (result.status !== "success") {
    throw new Error(`NeverBounce ${path}: ${result.status ?? "error"}${result.message ? ` - ${result.message}` : ""}`);
  }
  return result;
};

const neverbounceTools = (account: Account, signal: AbortSignal) =>
  router({
    single: router(
      {
        check: mutation(
          {
            approval: always(),
            description:
              "Verify one email address. Returns result (valid, invalid, disposable, catchall or unknown), flags describing the address and domain, and a suggested_correction for likely typos. Set address_info to include the parsed address parts, credits_info to include remaining credits, and timeout (seconds) to cap verification time before returning unknown. Consumes one verification credit.",
            input: object({
              email: string(),
              address_info: boolean().optional(),
              credits_info: boolean().optional(),
              timeout: number().optional(),
            }),
          },
          async ({ fetch }, { address_info, credits_info, ...input }) =>
            call(fetch, account, signal, "single/check", {
              ...input,
              address_info: address_info === undefined ? undefined : address_info ? 1 : 0,
              credits_info: credits_info === undefined ? undefined : credits_info ? 1 : 0,
            }),
        ),
      },
      { title: "Single verification", description: "Verify one email address in real time." },
    ),
    account: router(
      {
        info: query(
          {
            description:
              "Get the account's billing type, paid and free credits used and remaining, and counts of completed, processing, queued and under-review jobs.",
            input: object({}),
          },
          async ({ fetch }) => (await call(fetch, account, signal, "account/info", {})),
        ),
      },
      { title: "Account", description: "Credit balance and job counts." },
    ),
    jobs: router(
      {
        search: query(
          {
            description:
              "List bulk verification jobs. Optionally filter by job_id, filename, completed, processing, indexing, under_review or failed (booleans, pass true to include), and paginate with page (from 1) and items_per_page.",
            input: object({
              job_id: number().optional(),
              filename: string().optional(),
              completed: boolean().optional(),
              processing: boolean().optional(),
              indexing: boolean().optional(),
              under_review: boolean().optional(),
              failed: boolean().optional(),
              page: number().optional(),
              items_per_page: number().optional(),
            }),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/search", input)),
        ),
        status: query(
          {
            description:
              "Get one job's status: job_status, percent_complete, totals by result (valid, invalid, catchall, disposable, unknown, duplicates, bad_syntax), bounce_estimate and failure_reason.",
            input: object({ job_id: number() }),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/status", input)),
        ),
        results: query(
          {
            description:
              "Page through a completed job's results: each row has the original data and its verification result. Use page (from 1) and items_per_page. Set include_verification_time to add the time spent verifying each address.",
            input: object({
              job_id: number(),
              page: number().optional(),
              items_per_page: number().optional(),
              include_verification_time: boolean().optional(),
            }),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/results", input)),
        ),
        create: mutation(
          {
            description:
              "Create a bulk verification job. input_location is 'supplied' with input as an array of rows (each row an object like {id, email}), or 'remote_url' with input as a one-element array holding the CSV URL. filename names the job. Set auto_parse to parse immediately and auto_start to begin verifying (consumes credits) right after parsing; run_sample runs a sample first. Returns the job_id.",
            input: object({
              input: array(json()),
              input_location: string(),
              filename: string().optional(),
              auto_parse: boolean().optional(),
              auto_start: boolean().optional(),
              run_sample: boolean().optional(),
              allow_manual_review: boolean().optional(),
              callback_url: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/create", input)),
        ),
        parse: mutation(
          {
            description:
              "Parse a created job's input so it can be started. Set auto_start to start verification as soon as parsing finishes.",
            input: object({ job_id: number(), auto_start: boolean().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/parse", input)),
        ),
        start: mutation(
          {
            description:
              "Start verifying a parsed job that is waiting. This consumes verification credits. run_sample verifies a sample only; allow_manual_review permits NeverBounce to hold the job for review.",
            input: object({
              job_id: number(),
              run_sample: boolean().optional(),
              allow_manual_review: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/start", input)),
        ),
        delete: mutation(
          {
            description: "Permanently delete a job and its results.",
            input: object({ job_id: number() }),
            approval: always(),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "jobs/delete", input)),
        ),
        download: query(
          {
            description:
              "Download a completed job's results as CSV text. Filter with valids, invalids, catchalls, disposables and unknowns (booleans) and set binary_operators to return 1/0 instead of result names. Large jobs return large text; prefer results for paging.",
            input: object({
              job_id: number(),
              valids: boolean().optional(),
              invalids: boolean().optional(),
              catchalls: boolean().optional(),
              disposables: boolean().optional(),
              unknowns: boolean().optional(),
              binary_operators: boolean().optional(),
            }),
          },
          async ({ fetch }, input) => {
            const response = await fetch(`${base}/jobs/download`, {
              method: "POST",
              signal,
              headers: { "content-type": "application/json", accept: "application/octet-stream" },
              body: JSON.stringify({ key: account.fields.token, ...input }),
            });
            if (!response.ok) throw new Error(`NeverBounce jobs/download failed with HTTP ${response.status}`);
            const text = await response.text();
            if (text.trimStart().startsWith("{")) {
              const body = JSON.parse(text) as { status?: string; message?: string };
              if (body.status !== undefined && body.status !== "success") {
                throw new Error(`NeverBounce jobs/download: ${body.status} - ${body.message ?? ""}`);
              }
            }
            return { csv: text };
          },
        ),
      },
      { title: "Bulk jobs", description: "Create, run and read bulk email list verification jobs." },
    ),
    poe: router(
      {
        confirm: mutation(
          {
            description:
              "Confirm a Proof of Email token from the NeverBounce JavaScript widget so the verification result can be trusted server-side. Pass the email, the numeric result (0 valid, 1 invalid, 2 disposable, 3 catchall, 4 unknown), and the confirmation_token and transaction_id the widget returned.",
            input: object({
              email: string(),
              result: number(),
              confirmation_token: string(),
              transaction_id: string(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => (await call(fetch, account, signal, "poe/confirm", input)),
        ),
      },
      { title: "Proof of Email", description: "Confirm widget verification tokens." },
    ),
  });

export default defineApp({ user: { accounts: { neverbounce: neverbounce.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.neverbounce ?? [], (account) => neverbounceTools(account, signal), { signal }), {
    title: "NeverBounce",
    description: "Verify email addresses in real time or in bulk jobs, and check credits and job status with NeverBounce.",
    icons,
  }),
}));
