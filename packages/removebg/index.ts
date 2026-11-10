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

const removebg = defineProvider({
  name: "Remove.bg",
  hosts: ["api.remove.bg"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.remove.bg/v1.0/account", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`remove.bg rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { removebg: removebg.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.removebg ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Remove.bg",
        description: "Remove image backgrounds with remove.bg: background removal, Improvement Program submissions (uploads the image to remove.bg) and account credit balance. The service is scheduled to shut down self-service API access on 2026-12-01.",
        icons,
      },
    ),
  }),
);
