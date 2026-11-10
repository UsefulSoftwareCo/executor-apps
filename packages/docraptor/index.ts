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

const docraptor = defineProvider({
  name: "DocRaptor",
  hosts: ["api.docraptor.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The documented read-only Document Listing endpoint; the vendor documents 401 for a bad key.
  // 403 is not treated as a bad key: the vendor also uses it for refused requests on a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.docraptor.com/docs.json?per_page=1", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` },
    });
    if (response.status === 401) {
      throw new Error(`DocRaptor rejected the API key (401)`);
    }
  },
});

export default defineApp(
  { user: { accounts: { docraptor: docraptor.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docraptor ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DocRaptor",
        description: "Convert HTML to PDF, XLS and XLSX with DocRaptor: create documents, hosted documents and async jobs, check status, download and expire.",
        icons,
      },
    ),
  }),
);
