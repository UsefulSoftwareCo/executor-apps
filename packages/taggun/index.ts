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

const taggun = defineProvider({
  name: "Taggun",
  hosts: ["api.taggun.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Taggun has no account endpoint, and extraction costs a scan. Exporting product categories is a
  // free read-only call. Taggun returns 401 for a missing key and 403 for an invalid key, so only a
  // 2xx response proves the key was accepted.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.taggun.io/api/account/v1/product-categories/export", {
      signal,
      headers: { apikey: account.fields.token },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Taggun rejected the API key (${response.status})`);
    }
    if (!response.ok) throw new Error(`Taggun health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { taggun: taggun.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.taggun ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Taggun",
        description:
          "Extract structured data from receipts and invoices with Taggun OCR: simple and verbose scans, receipt validation, validation campaigns and data enrichment.",
        icons,
      },
    ),
  }),
);
