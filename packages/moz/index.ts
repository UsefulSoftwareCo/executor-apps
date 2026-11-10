import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  ProviderError,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { mcpRouter } from "apps/mcp";
import { icons } from "./icon.js";

const dataUrl = "https://api.moz.com/mcp/v1/data";
const localUrl = "https://api.moz.com/mcp/v1/local";

const bearer = (account: { method: "apiKey"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } }) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const moz = defineProvider({
  name: "Moz",
  hosts: ["api.moz.com"],
  auth: {
    // The Moz API key from moz.com/api/dashboard works as a bearer token on both MCP endpoints.
    apiKey: secrets({
      label: "Moz API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official MCP servers support OAuth with dynamic client registration (scope "mcp").
    oauth: oauth2({ discover: dataUrl, resource: null }),
  },
  // The servers accept any bearer string at initialize and tools/list, so mcpHealth cannot tell a
  // bad key from a good one. Make one read-only tool call and look for the authentication error.
  async health({ account, fetch, signal }) {
    const response = await fetch(dataUrl, {
      method: "POST",
      signal,
      headers: {
        ...bearer(account),
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "DataGlobalTopDomainList", arguments: {} },
      }),
    });
    if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
    if (response.status === 403) throw new ProviderError({ reason: "forbidden", status: 403 });
    if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
    const text = await response.text();
    if (text.includes("Missing or invalid authentication")) throw new ProviderError({ reason: "unauthorized" });
    if (response.headers.get("x-mcp-error") === "401") throw new ProviderError({ reason: "unauthorized" });
  },
});

export default defineApp(
  { user: { accounts: { moz: moz.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.moz ?? [],
        async (account) => {
          const approve = (tool: Parameters<typeof toolAnnotations>[0]) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always();
          const headers = bearer(account);
          return router({
            data: withApprovals(await mcpRouter({ url: dataUrl, account, headers, signal }), approve),
            local: withApprovals(await mcpRouter({ url: localUrl, account, headers, signal }), approve),
          });
        },
        { signal },
      ),
      {
        title: "Moz",
        description:
          "Moz SEO data (site metrics, links, keywords, rankings) under `data`, and Moz Local (business locations and listings) under `local`. Each needs its own Moz subscription.",
        icons,
      },
    ),
  }),
);
