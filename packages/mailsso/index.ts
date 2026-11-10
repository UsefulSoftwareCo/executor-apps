import {
  accountRouter,
  array,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.mails.so/v1";

const mailsso = defineProvider({
  name: "Mails.so",
  hosts: ["api.mails.so"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint. Looking up a batch job that cannot exist is free and read-only, but the
  // docs return 401 both for a bad key ("Unauthorized.") and for a valid key on a free plan ("Paid subscription
  // required to use list validations"). Only the first means the key is bad, so read the body.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/batch/00000000-0000-0000-0000-000000000000`, {
      signal,
      headers: { "x-mails-api-key": account.fields.token },
    });
    if (response.status !== 401) return;
    const body = await response.text();
    if (/paid subscription/i.test(body)) return;
    throw new Error("Mails.so rejected the API key (401)");
  },
});

type Fetch = typeof fetch;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { "x-mails-api-key": token };
  return router({
    validateEmail: query(
      {
        description:
          "Validate one email address. Returns data.result (deliverable, undeliverable, risky or unknown), data.reason, a 0-100 score and flags for format, domain, MX, block lists, catch-all, generic and free-provider checks. Counts against the account's validation credits.",
        input: object({ email: string({ minLength: 3 }) }),
      },
      async (_ctx, { email }) => {
        const response = await fetcher(`${base}/validate?email=${encodeURIComponent(email)}`, { signal, headers });
        return decodeJson(response, json());
      },
    ),
    batch: router(
      {
        create: mutation(
          {
            description:
              "Start an asynchronous bulk validation job for a list of email addresses. Returns the job id; poll batch.get until finished_at is set. Requires a paid Mails.so subscription.",
            input: object({ emails: array(string({ minLength: 3 })) }),
          },
          async (_ctx, { emails }) => {
            const response = await fetcher(`${base}/batch`, {
              method: "POST",
              signal,
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ emails }),
            });
            return decodeJson(response, json());
          },
        ),
        get: query(
          {
            description:
              "Get the status and results of a bulk validation job by id. The emails array holds one validation result per address once finished_at is populated.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => {
            const response = await fetcher(`${base}/batch/${encodeURIComponent(id)}`, { signal, headers });
            return decodeJson(response, json());
          },
        ),
      },
      { title: "Bulk validation", description: "Validate lists of email addresses asynchronously." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { mailsso: mailsso.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailsso ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mails.so",
        description: "Email validation with Mails.so: check single addresses and run bulk validation jobs.",
        icons,
      },
    ),
  }),
);
