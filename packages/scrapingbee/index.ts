import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://mcp.scrapingbee.com/mcp";

type Account = { fields: { token: string } };

// ScrapingBee's remote MCP server takes the API key as the `api_key` query parameter of its URL.
const serverUrl = (account: Account) => `${base}?api_key=${encodeURIComponent(account.fields.token)}`;

const scrapingbee = defineProvider({
  name: "ScrapingBee",
  hosts: ["mcp.scrapingbee.com", "app.scrapingbee.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The MCP server lists tools without a key, so validate the key against the read-only usage endpoint.
  // A bad key gets 401 {"message":"Invalid api key: ..."}.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://app.scrapingbee.com/api/v1/usage?api_key=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { scrapingbee: scrapingbee.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.scrapingbee ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url: serverUrl(account), account, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "ScrapingBee",
        description:
          "Web scraping with headless browsers and proxy rotation: page HTML, text and screenshots, structured extraction, Google, Amazon, Walmart and YouTube data, and credit usage.",
        icons,
      },
    ),
  }),
);
