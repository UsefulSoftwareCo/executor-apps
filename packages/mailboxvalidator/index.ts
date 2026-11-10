import { accountRouter, defineApp, defineProvider, object, query, router, secrets, string } from "apps";
import { icons } from "./icon.js";

const base = "https://api.mailboxvalidator.com/v2";

type ApiError = { error?: { error_code?: unknown; error_message?: unknown } };

const mailboxvalidator = defineProvider({
  name: "MailboxValidator",
  hosts: ["api.mailboxvalidator.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // MailboxValidator has no account endpoint. The probe calls the free-email check without an email,
  // so no credit should be spent: a valid key is expected to get 10000 (missing parameter), while
  // 10001 (key not found), 10002 (disabled) and 10003 (expired) mean the key is unusable. This ordering
  // is inferred from the documented error table, not observed live.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/email/free`);
    url.searchParams.set("key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const code = Number(body.error?.error_code);
    if (code === 10001 || code === 10002 || code === 10003) {
      throw new Error(`MailboxValidator rejected the API key: ${String(body.error?.error_message ?? code)}`);
    }
  },
});

export default defineApp(
  { user: { accounts: { mailboxvalidator: mailboxvalidator.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailboxvalidator ?? [],
        (account) => {
          const call = async (path: string, email: string) => {
            const url = new URL(`${base}${path}`);
            url.searchParams.set("key", account.fields.token);
            url.searchParams.set("email", email);
            url.searchParams.set("format", "json");
            const response = await fetch(url.toString(), { signal });
            const body = (await response.json().catch(() => null)) as ApiError | null;
            const error = body?.error;
            if (error !== undefined && error !== null) {
              throw new Error(`MailboxValidator error ${String(error.error_code)}: ${String(error.error_message ?? "")}`);
            }
            if (!response.ok) throw new Error(`MailboxValidator request failed with HTTP ${response.status}`);
            return body;
          };
          return router({
            validateEmail: query(
              {
                description:
                  "Fully verify one email address (GET /v2/validation/single). Returns syntax, MX record, SMTP connection and mailbox-existence checks, free/disposable/role/high-risk/catch-all/suppressed flags, greylisting and server-down status, DMARC and SPF strictness, website existence, a 0-1 mailboxvalidator_score (above 0.70 good, above 0.40 fair), an overall status verdict and credits_available. Nullable flags are null when not applicable. Yahoo addresses are unsupported. Spends validation credits.",
                input: object({ email: string({ minLength: 3 }) }),
              },
              async (_ctx, { email }) => call("/validation/single", email),
            ),
            checkDisposable: query(
              {
                description:
                  "Check whether an email address belongs to a disposable (temporary) email provider (GET /v2/email/disposable). Returns is_disposable and credits_available. Spends credits.",
                input: object({ email: string({ minLength: 3 }) }),
              },
              async (_ctx, { email }) => call("/email/disposable", email),
            ),
            checkFree: query(
              {
                description:
                  "Check whether an email address belongs to a free email provider such as Gmail or Hotmail (GET /v2/email/free). Returns is_free and credits_available. Spends credits.",
                input: object({ email: string({ minLength: 3 }) }),
              },
              async (_ctx, { email }) => call("/email/free", email),
            ),
          });
        },
        { signal },
      ),
      {
        title: "MailboxValidator",
        description: "Verify email addresses: syntax, MX and SMTP checks, mailbox existence, and disposable, free, role and catch-all detection.",
        icons,
      },
    ),
  }),
);
