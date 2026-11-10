import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { mapsOptions, routingOptions, searchOptions } from "./openapi.js";

const mcpUrl = "https://mcp.tomtom.com/maps";

// The official Maps MCP server takes the same API key in the `tomtom-api-key` header.
const mcpHeaders = (token: string) => ({ "tomtom-api-key": token });

const tomtom = defineProvider({
  name: "TomTom",
  hosts: ["api.tomtom.com", "mcp.tomtom.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // TomTom has no account endpoint; a geocode request validates the key.
  async health(check) {
    const { account, fetch, signal } = check;
    const response = await fetch(
      `https://api.tomtom.com/search/2/geocode/amsterdam.json?limit=1&key=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    // Every 200 geocode response carries a summary object with numResults.
    await decodeJson(response, object({ summary: object({ numResults: number() }) }));
    await mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(account.fields.token) });
  },
});

export default defineApp(
  { user: { accounts: { tomtom: tomtom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tomtom ?? [],
        async (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              mcp: withApprovals(
                await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account.fields.token), signal }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
              maps: mount(mapsOptions), routing: mount(routingOptions),
              search: mount(searchOptions),
            },
            { title: "TomTom", description: "TomTom location APIs and the official Maps MCP server." },
          );
        },
        { signal },
      ),
      {
        title: "TomTom",
        description:
          "TomTom. search: geocoding, reverse geocoding, fuzzy, POI, category and along-route search. routing: route calculation and reachable range. maps: raster and vector tiles, static images, copyrights, WMS and WMTS. mcp: the official TomTom Maps MCP server (routing, multi-stop optimization, geocoding, search, static maps, traffic flow and incidents).",
        icons,
      },
    ),
  }),
);
