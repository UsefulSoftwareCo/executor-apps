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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Docs: https://docs.kickbox.com/docs/using-the-api (EU-only accounts use api.eu.kickbox.com).
const kickbox = defineProvider({
  name: "Kickbox",
  hosts: ["api.kickbox.com", "api.eu.kickbox.com", "open.kickbox.com"],
  auth: {
    apiKey: secrets({
      label: "API key (live_... or test_...). Region: us or eu; use eu for accounts signed in at app.eu.kickbox.com",
      fields: object({
        region: plain(string({ minLength: 2 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Documented exception: Kickbox has no free account endpoint and each verification spends a
  // credit, so health only checks the region. A wrong key surfaces as a 401 on the first tool call.
  async health({ account }) {
    if (account.fields.region !== "us" && account.fields.region !== "eu") {
      throw new Error(`Unknown Kickbox region "${account.fields.region}". Use "us" or "eu".`);
    }
  },
});

export default defineApp(
  { user: { accounts: { kickbox: kickbox.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kickbox ?? [],
        (account) => {
          const base = account.fields.region === "eu" ? "https://api.eu.kickbox.com" : "https://api.kickbox.com";
          const headers = { authorization: `Bearer ${account.fields.token}` };
          return router({
            verify: query(
              {
                description:
                  "Verify one email address. Returns result (deliverable, undeliverable, risky, unknown), reason, role/free/disposable/accept_all flags, sendex quality score and a did_you_mean typo suggestion. Spends a verification credit on live keys. timeout is in milliseconds (default 6000, max 30000).",
                input: object({ email: string({ minLength: 1 }), timeout: number().optional() }),
              },
              async (_ctx, { email, timeout }) => {
                const url = new URL(`${base}/v2/verify`);
                url.searchParams.set("email", email);
                if (timeout !== undefined) url.searchParams.set("timeout", String(timeout));
                return decodeJson(await fetch(url.toString(), { signal, headers }), json());
              },
            ),
            batch: router({
              start: mutation(
                {
                  description:
                    "Start an asynchronous batch verification job. emails is a newline-separated list (one address per line, up to 1 million). Optional callback is a URL Kickbox POSTs to on completion, and filename names the job. Returns the job id. Spends credits.",
                  input: object({
                    emails: string({ minLength: 1 }),
                    callback: string().optional(),
                    filename: string().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, { emails, callback, filename }) =>
                  decodeJson(
                    await fetch(`${base}/v2/verify-batch`, {
                      method: "PUT",
                      signal,
                      headers: {
                        ...headers,
                        "content-type": "text/csv",
                        ...(callback === undefined ? {} : { "x-kickbox-callback": callback }),
                        ...(filename === undefined ? {} : { "x-kickbox-filename": filename }),
                      },
                      body: emails,
                    }),
                    json(),
                  ),
              ),
              status: query(
                {
                  description:
                    "Get the status of a batch verification job: starting, processing (with progress), completed (with stats and a one-hour download_url) or failed.",
                  input: object({ jobId: string({ minLength: 1 }) }),
                },
                async (_ctx, { jobId }) =>
                  decodeJson(
                    await fetch(`${base}/v2/verify-batch/${encodeURIComponent(jobId)}`, { signal, headers }),
                    json(),
                  ),
              ),
            }),
            disposable: query(
              {
                description:
                  "Free check of whether an email address or domain belongs to a known disposable email provider. Needs no credits.",
                input: object({ address: string({ minLength: 1 }) }),
              },
              async (_ctx, { address }) =>
                decodeJson(
                  await fetch(`https://open.kickbox.com/v1/disposable/${encodeURIComponent(address)}`, { signal }),
                  json(),
                ),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Kickbox",
        description:
          "Kickbox email verification: verify single addresses, run batch list verification jobs and check disposable domains.",
        icons,
      },
    ),
  }),
);
