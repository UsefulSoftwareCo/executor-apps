import {
  accountRouter,
  array,
  boolean,
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

const lumalabs = defineProvider({
  name: "Luma Labs",
  hosts: ["agents.lumalabs.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing files is the only free read-only call.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://agents.lumalabs.ai/v1/files?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ has_more: boolean(), data: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { lumalabs: lumalabs.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lumalabs ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Luma Labs",
        description: "Generate and edit images and videos with Luma's Agents API (uni-1 images, Ray 3.2 video) and manage reference files.",
        icons,
      },
    ),
  }),
);
