import { accountRouter, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Deliberate guide exception: PDF Vector has no read-only account or key-info endpoint
// (all 19 operations are billable POSTs), so there is no health check. See README.
const pdfvector = defineProvider({
  name: "PDF Vector",
  hosts: ["global.pdfvector.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

export default defineApp(
  { user: { accounts: { pdfvector: pdfvector.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfvector ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PDF Vector",
        description: "Parse documents to markdown, extract structured data, ask questions about documents, invoices, IDs and bank statements, and search academic papers and grants.",
        icons,
      },
    ),
  }),
);
