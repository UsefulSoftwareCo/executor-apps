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

// The API has no current-user endpoint, so there is no health check; a bad key
// surfaces as a 401 on the first call.
const slidesgpt = defineProvider({
  name: "SlidesGPT",
  hosts: ["api.slidesgpt.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

export default defineApp(
  { user: { accounts: { slidesgpt: slidesgpt.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.slidesgpt ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SlidesGPT",
        description: "Generate PowerPoint presentations from a prompt, then fetch, download, embed or delete them.",
        icons,
      },
    ),
  }),
);
