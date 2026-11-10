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

// These GET generators render a PDF or image, spend credits and create a vendor-side file,
// exactly like their POST siblings, so they are approved too (the spec classes them as queries).
const generatingGets = new Set([
  "chrome.chromeGetUrlToPdf",
  "chrome.chromeGetUrlToImage",
  "wkhtml.wkthmlGetUrlToPdf",
]);

const api2pdf = defineProvider({
  name: "Api2Pdf",
  hosts: ["v2.api2pdf.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /balance is authenticated and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://v2.api2pdf.com/balance", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    if (!response.ok) throw new Error(`Api2Pdf rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { api2pdf: api2pdf.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.api2pdf ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || generatingGets.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Api2Pdf",
        description:
          "Generate PDFs and images from HTML, URLs, markdown and Office files, merge and password-protect PDFs, and generate barcodes with Api2Pdf.",
        icons,
      },
    ),
  }),
);
