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

const allimagesai = defineProvider({
  name: "All Images AI",
  hosts: ["api.all-images.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.all-images.ai/v1/api-keys/check", {
      signal,
      headers: { "api-key": account.fields.token },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { allimagesai: allimagesai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.allimagesai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "All Images AI",
        description:
          "All-Images.ai: search, buy and download images, run AI image generations, manage webhooks and check credits.",
        icons,
      },
    ),
  }),
);
