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
import { ingestOptions, options } from "./openapi.js";

const invofox = defineProvider({
  name: "Invofox",
  hosts: ["api.invofox.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.invofox.com/documents?limit=1&select=_id", {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { invofox: invofox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.invofox ?? [],
        (account) =>
          router({
            main: withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
            ingest: withApprovals(liveOpenapiRouter({ ...ingestOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          }),
        { signal },
      ),
      {
        title: "Invofox",
        description:
          "Extract structured data from invoices and business documents with Invofox: uploads, documents, OCR, companies, providers, clients and users.",
        icons,
      },
    ),
  }),
);
