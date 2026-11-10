import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Every n8n instance has its own URL (https://<name>.app.n8n.cloud, or a self-hosted host). Credentials only
// ever go to that origin.
function instanceOf(raw: string): { origin: string; base: string } {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your n8n instance URL, for example https://your-instance.app.n8n.cloud.");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("The n8n instance must be reached over https.");
  if (url.search !== "" || url.hash !== "") throw new Error("Enter only the instance URL, with no query or fragment.");
  const path = url.pathname.replace(/\/+$/, "").replace(/\/api(\/v1)?$/, "");
  return { origin: url.origin, base: `${url.origin}${path}/api/v1` };
}

const n8n = defineProvider({
  name: "n8n",
  // The instance URL is part of the account, so there is no static `hosts`.
  auth: {
    // Created under Settings > n8n API in the n8n editor.
    apiKey: secrets({
      label: "API key",
      fields: object({
        instanceUrl: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { origin, base } = instanceOf(account.fields.instanceUrl);
    const response = await fetch(`${base}/workflows?limit=1`, {
      signal,
      headers: { Accept: "application/json", "X-N8N-API-KEY": account.fields.apiKey },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: origin, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { n8n: n8n.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.n8n ?? [],
        (account) => {
          const { origin, base } = instanceOf(account.fields.instanceUrl);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "n8n",
        description:
          "Manage an n8n instance: workflows, executions, credentials, tags, variables, users, projects and source control.",
        icons,
      },
    ),
  }),
);
