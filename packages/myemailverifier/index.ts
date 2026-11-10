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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://client.myemailverifier.com/verifier";

const myemailverifier = defineProvider({
  name: "MyEmailVerifier",
  hosts: ["client.myemailverifier.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The key is a URL path segment; the credits endpoint is read-only and free.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/getcredits/${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({ Credits: string() }));
  },
});

const myemailverifierTools = (key: string, signal: AbortSignal) => {
  const k = encodeURIComponent(key);
  return router({
    getCredits: query(
      {
        description: "Get the number of verification credits remaining on the account (returns { Credits }). Free.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/getcredits/${k}`, { signal }), json()),
    ),
    verifyEmail: query(
      {
        description:
          "Verify one email address in real time. Returns Address, Status (Valid, Invalid, Unknown, Catch All or Grey-listed), catch_all, Disposable_Domain, Role_Based, Free_Domain, Greylisted and Diagnosis. Uses one credit. On failure the API returns { status: false, msg }, for example when credits are exhausted. Grey-listed results should be retried after 5-10 hours.",
        input: object({ email: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/validate_single/${encodeURIComponent(input.email)}/${k}`, { signal }), json()),
    ),
    uploadList: mutation(
      {
        description:
          "Upload a list of email addresses for bulk verification (up to 100,000, one per row). Uses one credit per row. Returns { status, file_name, file_id, msg }; poll getFileInfo with file_id until status_label is completed.",
        input: object({ emails: array(string()), filename: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        form.set("api_key", key);
        form.set(
          "filename",
          new Blob([input.emails.join("\n")], { type: "text/plain" }),
          input.filename ?? "emails.txt",
        );
        return decodeJson(await fetch(`${base}/upload_file`, { method: "POST", signal, body: form }), json());
      },
    ),
    getFileInfo: query(
      {
        description:
          "Get status, progress and results of an uploaded bulk file by file_id. Returns file.status_label (queued, processing, completed), progress_percent, counts (valid, invalid, catchall, unknown, duplicates, spam_trap, toxic_domains, credit_used) and, once downloadable is true, per-category CSV and XLS download URLs. Poll every 30-60 seconds.",
        input: object({ file_id: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/file_info/${k}/${encodeURIComponent(input.file_id)}`, { signal }), json()),
    ),
  });
};

export default defineApp({ user: { accounts: { myemailverifier: myemailverifier.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.myemailverifier ?? [], (account) => myemailverifierTools(account.fields.token, signal), {
      signal,
    }),
    {
      title: "MyEmailVerifier",
      description: "Verify email addresses in real time or in bulk files and check remaining MyEmailVerifier credits.",
      icons,
    },
  ),
}));
