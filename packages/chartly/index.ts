import {
  accountRouter,
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

const chartly = defineProvider({
  name: "Chartly",
  hosts: ["api.chartly.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/status is unauthenticated, so it cannot prove the key. A 1x1 render needs the key
  // (401 otherwise) but spends one render from the plan; GET /v1/chart is the only keyed read.
  async health({ account, fetch, signal }) {
    const chart = encodeURIComponent(JSON.stringify({ type: "bar", data: { labels: ["a"], datasets: [{ data: [1] }] } }));
    const response = await fetch(`https://api.chartly.dev/v1/chart?width=1&height=1&format=svg&chart=${chart}`, {
      signal,
      headers: { "X-Api-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Chartly rejected the API key (${response.status})`);
    await response.arrayBuffer();
  },
});

export default defineApp(
  { user: { accounts: { chartly: chartly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chartly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Chartly",
        description:
          "Render Chart.js configurations as PNG or SVG images and create permanent chart URLs with Chartly.",
        icons,
      },
    ),
  }),
);
