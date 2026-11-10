import {
  accountRouter,
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

const base = "https://api.bulkemailchecker.com/real-time/";

const bulkemailchecker = defineProvider({
  name: "Bulk Email Checker",
  hosts: ["api.bulkemailchecker.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no free account endpoint; verifying a malformed address returns a result with a status.
  async health({ account, fetch, signal }) {
    const params = new URLSearchParams({ key: account.fields.token, email: "invalid" });
    const response = await fetch(`${base}?${params}`, { signal });
    await decodeJson(response, object({ status: string() }));
  },
});

type Account = { fields: { token: string } };

const bulkemailcheckerTools = (account: Account, signal: AbortSignal) =>
  router({
    verifyEmail: query(
      {
        description:
          "Verify one email address in real time. Returns status (passed, failed or unknown), an event code (mailbox_exists, mailbox_does_not_exist, mailbox_full, invalid_syntax, domain_does_not_exist, mxserver_does_not_exist, is_catchall, is_greylisting, inconclusive, blacklisted_*), a readable details string, a suggested typo correction, flags (isDisposable, isFreeService, isRoleAccount, isGibberish, isOffensive, isComplainer), mail-server enrichment (mxEnrichment) and the remaining credits and hourly quota. Each passed or failed result costs one credit; unknown results are free. label tags the address in your blacklist if it fails (default 'Real-time API'). One address per call; the hourly request quota applies (1,500 on the default plan) and HTTP 429 means retry after a short back-off.",
        input: object({ email: string(), label: string().optional() }),
      },
      async ({ fetch }, { email, label }) => {
        const params = new URLSearchParams({ key: account.fields.token, email });
        if (label !== undefined) params.set("label", label);
        return decodeJson(await fetch(`${base}?${params}`, { signal }), json());
      },
    ),
  });

export default defineApp(
  { user: { accounts: { bulkemailchecker: bulkemailchecker.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.bulkemailchecker ?? [], (account) => bulkemailcheckerTools(account, signal), { signal }),
      {
        title: "Bulk Email Checker",
        description:
          "Verify email addresses in real time: deliverability, disposable, role and catch-all detection, typo suggestions and mail-server details.",
        icons,
      },
    ),
  }),
);
