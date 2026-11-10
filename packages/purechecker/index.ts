import {
  accountRouter,
  array,
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

const base = "https://purechecker.com/api/v1";

const purechecker = defineProvider({
  name: "PureChecker",
  hosts: ["purechecker.com"],
  auth: {
    apiKey: secrets({
      label: "API credentials",
      fields: object({ userId: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  // PureChecker has no free account endpoint; a check of a reserved address is the only authenticated call.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/single-check?email=${encodeURIComponent("postmaster@example.com")}`, {
      signal,
      headers: {
        "x-user-id": account.fields.userId,
        "x-secret-key": account.fields.secretKey,
        Accept: "application/json",
      },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

type Account = { fields: { userId: string; secretKey: string } };

const headers = (account: Account) => ({
  "x-user-id": account.fields.userId,
  "x-secret-key": account.fields.secretKey,
  Accept: "application/json",
});

const purecheckerTools = (account: Account, signal: AbortSignal) =>
  router({
    checkEmail: query(
      {
        description:
          "Verify one email address. Returns reason, isExist, isDisposable, isValidSyntax, isValidDomain, isDisable, is2FA, riskLevel, domain and MX records. Each check consumes a PureChecker credit.",
        input: object({ email: string() }),
      },
      async ({ fetch }, { email }) =>
        decodeJson(
          await fetch(`${base}/single-check?email=${encodeURIComponent(email)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    checkEmails: query(
      {
        description:
          "Verify a batch of email addresses in one request. Returns a results array with the same fields as checkEmail for each address. PureChecker does not document a batch size limit. Each address consumes a credit.",
        input: object({ emails: array(string()) }),
      },
      async ({ fetch }, { emails }) =>
        decodeJson(
          await fetch(`${base}/bulk-check`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(emails),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { purechecker: purechecker.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.purechecker ?? [], (account) => purecheckerTools(account, signal), { signal }), {
    title: "PureChecker",
    description: "Verify single or bulk email addresses for syntax, domain, mailbox existence, disposability and risk.",
    icons,
  }),
}));
