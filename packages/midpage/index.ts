import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Pinned to the v4 contract; the unversioned /mcp follows the latest major version and may break.
const mcpUrl = "https://app.midpage.ai/mcp/v4";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const midpage = defineProvider({
  name: "Midpage",
  hosts: ["app.midpage.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Midpage publishes protected-resource metadata and supports dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  // GET /me accepts both API keys and OAuth tokens.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.midpage.ai/api/v1/me", {
      signal,
      headers: headers(account),
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { midpage: midpage.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.midpage ?? [],
        async (account) =>
          router({
            api: withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
            mcp: withApprovals(
              await mcpRouter({ url: mcpUrl, account, headers: headers(account), cache, signal }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            ),
          }),
        { signal },
      ),
      {
        title: "Midpage",
        description: "Legal research over U.S. case law, statutes and regulations in Midpage.",
        icons,
      },
    ),
  }),
);
