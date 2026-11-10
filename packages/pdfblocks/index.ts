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

const pdfblocks = defineProvider({
  name: "PDF Blocks",
  hosts: ["api.pdfblocks.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // No health check: all 17 actions are POST and process a file, so there is no read-only endpoint.
});

export default defineApp(
  { user: { accounts: { pdfblocks: pdfblocks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfblocks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PDF Blocks",
        description: "Process PDF documents: merge, split (by page count, at a page, by size or into page groups), extract, remove, reverse, reorder and rotate pages, add or remove passwords, restrictions, signatures and watermarks.",
        icons,
      },
    ),
  }),
);
