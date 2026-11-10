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
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://hjarni.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const bearer = (account: Account) =>
  account.method === "oauth" ? account.fields.access_token : account.fields.token;

const hjarni = defineProvider({
  name: "Hjarni",
  hosts: ["hjarni.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Dynamic client registration; the connect flow acts with the person's full access.
    oauth: oauth2({ discover: "https://hjarni.com/" }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${bearer(account)}` } });
    }
    const response = await fetch("https://hjarni.com/api/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${bearer(account)}` },
    });
    await decodeJson(response, object({}));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { hjarni: hjarni.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hjarni ?? [],
        async (account) =>
          router({
            api: withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
            // Official MCP server: adds teams, folder permissions, email capture, feedback, nudges.
            mcp: withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${bearer(account)}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            ),
          }),
        { signal },
      ),
      {
        title: "Hjarni",
        description:
          "Read and write Hjarni notes, folders (containers) and tags, plus teams, folder permissions and email capture via MCP: search, create, edit, link, move, archive and restore notes in your Markdown knowledge base.",
        icons,
      },
    ),
  }),
);
