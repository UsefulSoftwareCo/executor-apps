import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  boolean,
  object,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.formilla.com/api";

const formilla = defineProvider({
  name: "Formilla",
  hosts: ["api.formilla.com"],
  auth: {
    apiKey: secrets({
      label: "Secure token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The REST API has no read endpoint. A contact request with neither UserId nor Email performs no action:
  // a valid token gets 400, an invalid token (or exceeded contact limit) gets 403.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/contacts`, {
      method: "POST",
      signal,
      headers: { formilla_auth_token: account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Formilla rejected the secure token (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    contacts: router(
      {
        createOrUpdate: mutation(
          {
            description:
              "Create a Formilla contact or update an existing one. Provide UserId or Email (at least one). If both are given, Formilla matches by UserId first, then Email; if neither matches a new contact is created. SignedUp_date is a Unix timestamp in seconds. CustomAttributes is a JSON object of key/value pairs. Returns the HTTP status and response body; 200 means success, 400 missing identifier, 403 invalid token or contact limit exceeded.",
            input: object({
              UserId: string().optional(),
              Email: string().optional(),
              FirstName: string().optional(),
              LastName: string().optional(),
              Phone: string().optional(),
              SignedUp_date: number().optional(),
              IsUnsubscribed: boolean().optional(),
              CustomAttributes: record(json()).optional(),
            }),
          },
          async (_ctx, input) => {
            if (!input.UserId && !input.Email) throw new Error("Provide UserId or Email");
            const response = await fetcher(`${base}/contacts`, {
              method: "POST",
              signal,
              headers: { formilla_auth_token: token, "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            const text = await response.text();
            if (!response.ok) throw new Error(`Formilla returned ${response.status}: ${text}`);
            return { status: response.status, body: text };
          },
        ),
      },
      { title: "Contacts", description: "Push customer data into Formilla." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { formilla: formilla.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.formilla ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Formilla",
        description: "Create or update customer contacts in Formilla live chat and marketing automation.",
        icons,
      },
    ),
  }),
);
