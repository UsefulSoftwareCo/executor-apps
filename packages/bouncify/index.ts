import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.bouncify.io/v1";

type Params = Record<string, string | undefined>;

function url(path: string, key: string, params: Params = {}) {
  const target = new URL(`${api}${path}`);
  target.searchParams.set("apikey", key);
  for (const [name, value] of Object.entries(params)) if (value !== undefined) target.searchParams.set(name, value);
  return target.toString();
}

// Bouncify reports failures as 4xx JSON bodies carrying `success: false` and a `result` or `message` string.
function failure(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const body = result as { success?: unknown; result?: unknown; message?: unknown };
  if (body.success !== false && body.success !== "false") return undefined;
  if (typeof body.result === "string") return body.result;
  if (typeof body.message === "string") return body.message;
  return "request failed";
}

const bouncify = defineProvider({
  name: "Bouncify",
  hosts: ["api.bouncify.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // An invalid key answers 401 {"success":false,"result":"Invalid API key"}.
  async health({ account, fetch, signal }) {
    const result = await decodeJson(await fetch(url("/info", account.fields.token), { signal }), json());
    const message = failure(result);
    if (message !== undefined) throw new Error(`Bouncify rejected the API key: ${message}`);
  },
});

export default defineApp(
  { user: { accounts: { bouncify: bouncify.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bouncify ?? [],
        (account) => {
          const key = account.fields.token;
          const read = async (response: Response) => {
            const result = await decodeJson(response, json());
            const message = failure(result);
            if (message !== undefined) throw new Error(`Bouncify: ${message}`);
            return result;
          };
          const jobId = object({ jobId: string({ minLength: 1 }) });
          return router({
            getCredits: query(
              { description: "Get the remaining verification credit balance of the account.", input: object({}) },
              async () => read(await fetch(url("/info", key), { signal })),
            ),
            verify: mutation(
              {
                description:
                  "Verify one email address in real time. Returns result (deliverable, undeliverable, accept all or unknown), a message, and flags for role, free_email, disposable, spamtrap and accept_all. Spends a verification credit, so approval is required. The vendor advises rejecting only undeliverable addresses.",
                approval: always(),
                input: object({ email: string({ minLength: 3 }) }),
              },
              async (_ctx, { email }) => read(await fetch(url("/verify", key, { email }), { signal })),
            ),
            bulk: router({
              uploadEmails: mutation(
                {
                  description:
                    "Create a bulk verification list from an array of emails. Each item is an object with an email field plus any extra columns (for example firstname, lastname), which are kept as CSV columns. With autoVerify false (default) the list becomes ready and verification must be started with bulk.start; with autoVerify true verification starts at once and spends credits. Returns jobId. Limits: 500 unverified lists, 100 concurrent active lists.",
                  approval: always(),
                  input: object({
                    emails: array(object({ email: string({ minLength: 3 }) })),
                    autoVerify: boolean().optional(),
                  }),
                },
                async (_ctx, { emails, autoVerify }) =>
                  read(
                    await fetch(url("/bulk", key), {
                      method: "POST",
                      signal,
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ emails, ...(autoVerify === undefined ? {} : { auto_verify: String(autoVerify) }) }),
                    }),
                  ),
              ),
              uploadCsv: mutation(
                {
                  description:
                    "Create a bulk verification list from CSV text (up to 10 MB; a column of email addresses, extra columns are kept). content is the CSV file text. With autoVerify false (default) the list becomes ready and verification must be started with bulk.start; with autoVerify true verification starts at once and spends credits. Returns jobId.",
                  approval: always(),
                  input: object({
                    fileName: string({ minLength: 1 }),
                    content: string({ minLength: 1 }),
                    autoVerify: boolean().optional(),
                  }),
                },
                async (_ctx, { fileName, content, autoVerify }) => {
                  const form = new FormData();
                  form.append("local_file", new Blob([content], { type: "text/csv" }), fileName);
                  if (autoVerify !== undefined) form.append("auto_verify", String(autoVerify));
                  return read(await fetch(url("/bulk", key), { method: "POST", signal, body: form }));
                },
              ),
              start: mutation(
                {
                  description:
                    "Start verifying a bulk list whose status is ready. Spends one credit per email. A list can be started only once and verification cannot be paused, stopped or restarted.",
                  approval: always(),
                  input: jobId,
                },
                async (_ctx, { jobId }) =>
                  read(
                    await fetch(url(`/bulk/${encodeURIComponent(jobId)}`, key), {
                      method: "PATCH",
                      signal,
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ action: "start" }),
                    }),
                  ),
              ),
              status: query(
                {
                  description:
                    "Get the status of a bulk list (preparing, ready, verifying, completed, failed or cancelled) with total, verified and pending counts, analysis (common_isp, role_based, disposable, spamtrap, syntax_error) and results (deliverable, undeliverable, accept_all, unknown) counts.",
                  input: jobId,
                },
                async (_ctx, { jobId }) => read(await fetch(url(`/bulk/${encodeURIComponent(jobId)}`, key), { signal })),
              ),
              download: query(
                {
                  description:
                    "Download the results of a completed bulk list as CSV text. filterResult selects result types to include: any of deliverable, undeliverable, accept_all, unknown (default all four).",
                  input: object({
                    jobId: string({ minLength: 1 }),
                    filterResult: array(string({ minLength: 1 })).optional(),
                  }),
                },
                async (_ctx, { jobId, filterResult }) => {
                  const response = await fetch(url("/download", key, { jobId }), {
                    method: "POST",
                    signal,
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      filterResult: filterResult ?? ["deliverable", "undeliverable", "accept_all", "unknown"],
                    }),
                  });
                  const text = await response.text();
                  if (text.trimStart().startsWith("{")) {
                    let parsed: unknown;
                    try {
                      parsed = JSON.parse(text);
                    } catch {
                      parsed = undefined;
                    }
                    const message = failure(parsed);
                    if (message !== undefined) throw new Error(`Bouncify: ${message}`);
                  }
                  if (!response.ok) throw new Error(`Bouncify: HTTP ${response.status}`);
                  return { csv: text };
                },
              ),
              delete: mutation(
                {
                  description:
                    "Permanently delete a bulk list and its results. Only possible while the list is ready or completed; this cannot be undone.",
                  approval: always(),
                  input: jobId,
                },
                async (_ctx, { jobId }) =>
                  read(await fetch(url(`/bulk/${encodeURIComponent(jobId)}`, key), { method: "DELETE", signal })),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Bouncify",
        description: "Verify email addresses with Bouncify: real-time single verification, bulk list upload, verification, status and results download, and credit balance.",
        icons,
      },
    ),
  }),
);
