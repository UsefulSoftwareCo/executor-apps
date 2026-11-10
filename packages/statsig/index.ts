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

const apiVersion = "20240601";

const withVersion =
  (base: typeof fetch): typeof fetch =>
  (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("STATSIG-API-VERSION", apiVersion);
    return base(input, { ...init, headers });
  };

const statsig = defineProvider({
  name: "Statsig",
  hosts: ["statsigapi.net"],
  auth: {
    apiKey: secrets({
      label: "Console API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://statsigapi.net/console/v1/users?limit=1&page=1", {
      signal,
      headers: { "STATSIG-API-KEY": account.fields.token, "STATSIG-API-VERSION": apiVersion },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { statsig: statsig.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.statsig ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch: withVersion(fetch), signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Statsig",
        description:
          "Manage Statsig feature gates, experiments, dynamic configs, layers, metrics, segments, tags and project settings.",
        icons,
      },
    ),
  }),
);
