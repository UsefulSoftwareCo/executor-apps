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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.emailable.com/v1";

const emailable = defineProvider({
  name: "Emailable",
  hosts: ["api.emailable.com", "app.emailable.com"],
  auth: {
    apiKey: secrets({
      label: "Private API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Emailable has no client registration: the connect page asks for the OAuth app's client ID and secret.
    oauth: oauth2({
      authorizationUrl: "https://app.emailable.com/oauth/authorize",
      tokenUrl: "https://app.emailable.com/oauth/token",
      revocationUrl: "https://app.emailable.com/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["all"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, { signal, headers: headers(account) });
    const body = await decodeJson(response, object({ owner_email: string() }));
    return { accountInfo: { externalId: body.owner_email, username: body.owner_email } };
  },
});

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const emailableTools = (account: Account, signal: AbortSignal) =>
  router({
    account: query(
      {
        description: "Get the account owner's email address and the number of credits remaining (owner_email, available_credits).",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/account`, { signal, headers: headers(account) }), json()),
    ),
    verify: query(
      {
        description:
          "Verify one email address. Returns state (deliverable, undeliverable, risky, unknown), reason, score, did_you_mean, disposable, free, role, accept_all, mailbox_full, smtp_provider and name guesses. Uses one credit. If verification takes longer than the timeout the API answers 249; call again within 5 minutes without being charged twice. smtp=false is faster but much less accurate; accept_all=true adds an accept-all check and is slower. timeout is 2-10 seconds (default 5).",
        input: object({
          email: string(),
          smtp: boolean().optional(),
          accept_all: boolean().optional(),
          timeout: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/verify?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    createBatch: mutation(
      {
        description:
          "Start verifying a batch of up to 50,000 emails asynchronously. Returns the batch id; poll getBatch for results. url is an optional webhook that receives the results by POST when the batch finishes. response_fields limits the fields returned per email (comma-separated, for example email,state,reason,score). retries=false is faster but may yield more unknown results. Uses one credit per email.",
        input: object({
          emails: array(string()),
          url: string().optional(),
          response_fields: string().optional(),
          retries: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/batch`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getBatch: query(
      {
        description:
          "Get the status of a batch by id. While running it returns processed and total; when finished it returns total_counts, reason_counts and, for batches up to 1,000 emails, the emails array, otherwise a temporary download_file CSV link. partial=true includes partial results for batches up to 1,000 emails. Batch creation can answer 402 when credits are insufficient.",
        input: object({ id: string(), partial: boolean().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/batch?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
  });

export default defineApp({ user: { accounts: { emailable: emailable.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.emailable ?? [], (account) => emailableTools(account, signal), { signal }), {
    title: "Emailable",
    description: "Verify email addresses singly or in batches and check remaining Emailable credits.",
    icons,
  }),
}));
