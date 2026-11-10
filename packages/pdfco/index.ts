import {
  accountRouter,
  decodeJson,
  number,
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

const pdfco = defineProvider({
  name: "PDF.co",
  hosts: ["api.pdf.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.pdf.co/v1/account/credit/balance", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ remainingCredits: number() }));
  },
});

export default defineApp(
  { user: { accounts: { pdfco: pdfco.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfco ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PDF.co",
        description: "Convert, edit, merge, split, parse, fill, OCR and generate PDFs, barcodes and documents with PDF.co.",
        icons,
      },
    ),
  }),
);
