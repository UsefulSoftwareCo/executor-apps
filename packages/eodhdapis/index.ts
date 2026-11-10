import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const oauthUrl = "https://mcp.eodhd.com/v2/mcp";
const keyUrl = "https://mcp.eodhd.com/v1/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// The v1 server takes the API key as an `apikey` query parameter; v2 takes an OAuth bearer token.
const connection = (account: Account): { url: string; headers: Record<string, string> } =>
  account.method === "oauth"
    ? { url: oauthUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } }
    : { url: `${keyUrl}?apikey=${encodeURIComponent(account.fields.token)}`, headers: {} };

const eodhd = defineProvider({
  name: "EODHD APIs",
  hosts: ["mcp.eodhd.com", "eodhd.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      discover: oauthUrl,
      scopes: [
        "read:eod",
        "read:intraday",
        "read:live",
        "read:fundamentals",
        "read:news",
        "read:technicals",
        "read:options",
        "read:marketplace",
        "read:screener",
        "read:macro",
        "read:user",
      ],
    }),
  },
  // The MCP v1 endpoint lists tools without a key, so verify credentials against the REST API.
  async health({ account, fetch, signal }) {
    // The vendor docs only document OAuth tokens for the MCP server, so check OAuth against it.
    if (account.method === "oauth") {
      return mcpHealth(
        { account, fetch, signal },
        { url: oauthUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } },
      );
    }
    const response = await fetch(
      `https://eodhd.com/api/user?fmt=json&api_token=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { eodhd: eodhd.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eodhd ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ ...connection(account), account, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "EODHD APIs",
        description:
          "Financial market data from EODHD: end-of-day, intraday and live prices, fundamentals, news, technical indicators, options, screener and macro data.",
        icons,
      },
    ),
  }),
);
