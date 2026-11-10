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

const winstonai = defineProvider({
  name: "Winston AI",
  hosts: ["api.gowinston.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // No health check: Winston has no read-only or account endpoint (every operation is a
  // billable POST), so there is no safe way to verify a key without spending credits.
});

export default defineApp(
  { user: { accounts: { winstonai: winstonai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.winstonai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Winston AI",
        description: "Detect AI-generated text and images, check plagiarism, fact-check and compare texts with Winston AI.",
        icons,
      },
    ),
  }),
);
