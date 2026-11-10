import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://apilayer.net/api";

const mailboxlayer = defineProvider({
  name: "Mailboxlayer",
  hosts: ["apilayer.net"],
  auth: {
    apiKey: secrets({
      label: "Access key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Mailboxlayer has no account endpoint, so health probes /check with no email. The vendor docs
  // (docs.apilayer.com, login-gated) could not be read; this is unverified: a valid key is expected to
  // get error 210 (no_email_address_supplied), and the probe might still spend one credit.
  // Error set, from live responses (vendor table unreadable):
  //   101 invalid/missing access key (observed live), 102 inactive_user, 106 treated as an access-key
  //   error -> key rejected.
  //   105 https_access_restricted -> free plans reject HTTPS, which this package always uses, so
  //   every call would fail -> rejected with a plan message.
  //   103 is a validation error, 104 is quota exhaustion: the key itself is valid, so the
  //   account connects and tool calls surface the error.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/check`);
    url.searchParams.set("access_key", account.fields.token);
    const body = await decodeJson(
      await fetch(url.toString(), { signal }),
      object({ error: object({ code: json() }).optional() }),
    );
    const code = body.error?.code;
    if (code === 105) throw new Error("Mailboxlayer HTTPS access requires a paid plan");
    if (code === 101 || code === 102 || code === 106) throw new Error("Mailboxlayer rejected the access key");
  },
});

export default defineApp(
  { user: { accounts: { mailboxlayer: mailboxlayer.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailboxlayer ?? [],
        (account) =>
          router({
            check: query(
              {
                description:
                  "Validate one email address. Returns format validity, MX record and SMTP check results, disposable/free/role flags, a did-you-mean suggestion and a 0-1 deliverability score. Each call spends one credit. smtp (default true) runs the SMTP check; catchAll also tests whether the domain accepts every address (Professional plans and above).",
                input: object({
                  email: string({ minLength: 3 }),
                  smtp: boolean().optional(),
                  catchAll: boolean().optional(),
                }),
              },
              async (_ctx, { email, smtp, catchAll }) => {
                const url = new URL(`${base}/check`);
                url.searchParams.set("access_key", account.fields.token);
                url.searchParams.set("email", email);
                if (smtp !== undefined) url.searchParams.set("smtp", smtp ? "1" : "0");
                if (catchAll !== undefined) url.searchParams.set("catch_all", catchAll ? "1" : "0");
                url.searchParams.set("format", "0");
                // Errors are 200 responses with { success: false, error }; surface them without the URL.
                const result = await decodeJson(await fetch(url.toString(), { signal }), json());
                const error = (result as { error?: { code?: unknown; type?: unknown; info?: unknown } } | null)?.error;
                if (error !== undefined && error !== null && (result as { success?: unknown }).success === false) {
                  throw new Error(`Mailboxlayer error ${String(error.code)} ${String(error.type)}: ${String(error.info ?? "")}`);
                }
                return result;
              },
            ),
          }),
        { signal },
      ),
      {
        title: "Mailboxlayer",
        description: "Validate and verify email addresses: syntax, MX and SMTP checks, disposable, free and role detection, typo suggestions and a deliverability score.",
        icons,
      },
    ),
  }),
);
