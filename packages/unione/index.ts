import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Every UniOne method is a POST, so the HTTP verb cannot tell reads from writes.
const readOnly = /(Get|List|Check|Info|Ping|DnsRecords)$/;

const unione = defineProvider({
  name: "UniOne",
  hosts: ["api.unione.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // POST /system/info.json is read-only and answers for both user and project keys.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.unione.io/en/transactional/api/v1/system/info.json", {
      method: "POST",
      signal,
      headers: { "X-API-KEY": account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) throw new Error(`UniOne rejected the API key (${response.status})`);
    await decodeJson(response, object({ email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { unione: unione.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.unione ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" && !readOnly.test(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "UniOne",
        description:
          "Send and manage transactional email with UniOne: sending, templates, webhooks, domains, suppressions, projects and email validation.",
        icons,
      },
    ),
  }),
);
